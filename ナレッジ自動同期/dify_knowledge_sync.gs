// ============================================================
// Dify ナレッジベース 自動同期 GAS スクリプト
// 
// 【機能】
// スプレッドシートの内容を毎日自動でDifyナレッジベースに同期する
// 処理: 既存ドキュメントを全削除 → スプレッドシートから最新データを登録
//
// 【セットアップ手順】
// 1. このスクリプトをGASエディタに貼り付ける
// 2. スクリプトプロパティに以下を設定:
//    - DIFY_API_KEY: DifyのdatasetAPIキー（dataset-xxxxxxx）
//    - DIFY_BASE_URL: DifyのAPIベースURL（例: https://api.dify.ai/v1）
//    - DIFY_DATASET_ID: ナレッジベースのID
// 3. syncKnowledgeToDify() を手動実行してテスト
// 4. 「トリガー」から毎日実行を設定
// ============================================================

// ─── 設定値の取得 ─── 
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    apiKey: props.getProperty("DIFY_API_KEY"),
    baseUrl: props.getProperty("DIFY_BASE_URL") || "https://api.dify.ai/v1",
    datasetId: props.getProperty("DIFY_DATASET_ID")
  };
}

// ─── メイン処理: スプレッドシート → Dify ナレッジ同期 ─── 
function syncKnowledgeToDify() {
  var config = getConfig();
  
  if (!config.apiKey || !config.datasetId) {
    Logger.log("❌ エラー: スクリプトプロパティに DIFY_API_KEY と DIFY_DATASET_ID を設定してください");
    return;
  }
  
  Logger.log("=== Difyナレッジベース同期開始 ===");
  Logger.log("対象Dataset: " + config.datasetId);
  
  // Step 1: 既存ドキュメントを全て削除
  deleteAllDocuments(config);
  
  // Step 2: スプレッドシートからデータを読み取り、Difyに登録
  registerDocumentsFromSheet(config);
  
  Logger.log("=== 同期完了 ===");
}

// ─── Step 1: 既存ドキュメントの全削除 ─── 
function deleteAllDocuments(config) {
  Logger.log("--- 既存ドキュメントの削除を開始 ---");
  
  var page = 1;
  var hasMore = true;
  var deletedCount = 0;
  
  while (hasMore) {
    // ドキュメント一覧を取得（1ページ100件）
    var listUrl = config.baseUrl + "/datasets/" + config.datasetId + "/documents?page=" + page + "&limit=100";
    var listResponse = UrlFetchApp.fetch(listUrl, {
      method: "get",
      headers: {
        "Authorization": "Bearer " + config.apiKey
      },
      muteHttpExceptions: true
    });
    
    var listData = JSON.parse(listResponse.getContentText());
    
    if (!listData.data || listData.data.length === 0) {
      hasMore = false;
      break;
    }
    
    // 各ドキュメントを削除
    for (var i = 0; i < listData.data.length; i++) {
      var doc = listData.data[i];
      var deleteUrl = config.baseUrl + "/datasets/" + config.datasetId + "/documents/" + doc.id;
      
      try {
        UrlFetchApp.fetch(deleteUrl, {
          method: "delete",
          headers: {
            "Authorization": "Bearer " + config.apiKey
          },
          muteHttpExceptions: true
        });
        deletedCount++;
        Logger.log("  削除: " + doc.name);
      } catch (e) {
        Logger.log("  ⚠️ 削除失敗: " + doc.name + " - " + e.message);
      }
      
      // API レート制限対策（0.5秒待機）
      Utilities.sleep(500);
    }
    
    // 削除後は常にpage=1で再取得（削除によりページが変わるため）
    page = 1;
    
    // 全件取得済みかチェック
    if (listData.data.length < 100) {
      hasMore = false;
    }
  }
  
  Logger.log("--- 削除完了: " + deletedCount + "件 ---");
}

// ─── Step 2: スプレッドシートからDifyにドキュメント登録 ─── 
function registerDocumentsFromSheet(config) {
  Logger.log("--- ドキュメント登録を開始 ---");
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  var registeredCount = 0;
  
  for (var s = 0; s < sheets.length; s++) {
    var sheet = sheets[s];
    var sheetName = sheet.getName();
    
    // 非表示シートや設定用シートはスキップ
    if (sheet.isSheetHidden()) {
      Logger.log("  スキップ（非表示）: " + sheetName);
      continue;
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      Logger.log("  スキップ（データなし）: " + sheetName);
      continue;
    }
    
    // CSVテキストに変換
    var csvText = data.map(function(row) {
      return row.map(function(cell) {
        // セルの値を文字列に変換し、カンマや改行を含む場合はダブルクォート
        var str = String(cell);
        if (str.indexOf(",") >= 0 || str.indexOf("\n") >= 0 || str.indexOf('"') >= 0) {
          str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      }).join(",");
    }).join("\n");
    
    // Dify API でドキュメント作成
    var createUrl = config.baseUrl + "/datasets/" + config.datasetId + "/document/create-by-text";
    
    var payload = {
      "name": sheetName,
      "text": csvText,
      "indexing_technique": "high_quality",
      "process_rule": {
        "mode": "automatic"
      }
    };
    
    try {
      var response = UrlFetchApp.fetch(createUrl, {
        method: "post",
        headers: {
          "Authorization": "Bearer " + config.apiKey,
          "Content-Type": "application/json"
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      
      var statusCode = response.getResponseCode();
      if (statusCode === 200 || statusCode === 201) {
        registeredCount++;
        Logger.log("  ✅ 登録成功: " + sheetName);
      } else {
        Logger.log("  ❌ 登録失敗: " + sheetName + " (HTTP " + statusCode + ")");
        Logger.log("     レスポンス: " + response.getContentText().substring(0, 200));
      }
    } catch (e) {
      Logger.log("  ❌ 登録エラー: " + sheetName + " - " + e.message);
    }
    
    // API レート制限対策（1秒待機）
    Utilities.sleep(1000);
  }
  
  Logger.log("--- 登録完了: " + registeredCount + "件 ---");
}

// ─── 手動テスト用: 接続確認のみ ─── 
function testConnection() {
  var config = getConfig();
  
  if (!config.apiKey || !config.datasetId) {
    Logger.log("❌ スクリプトプロパティが未設定です");
    return;
  }
  
  var url = config.baseUrl + "/datasets/" + config.datasetId + "/documents?page=1&limit=5";
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      "Authorization": "Bearer " + config.apiKey
    },
    muteHttpExceptions: true
  });
  
  Logger.log("HTTP Status: " + response.getResponseCode());
  Logger.log("Response: " + response.getContentText().substring(0, 500));
}
