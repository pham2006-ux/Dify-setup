// ============================================================
// Dify ナレッジベース 自動同期 GAS スクリプト（Googleドキュメント版）
//
// 【機能】
// 複数のGoogleドキュメントの内容を毎日自動でDifyナレッジに同期する
//
// 【セットアップ】
// 1. Google Driveから「新規」→「Apps Script」で新規プロジェクトを作成
// 2. このコードを貼り付け
// 3. スクリプトプロパティに以下を設定:
//    - DIFY_API_KEY:    DifyのdatasetAPIキー
//    - DIFY_BASE_URL:   https://api.dify.ai/v1
//    - DIFY_DATASET_ID: ナレッジベースのID
// 4. DOC_LIST にGoogleドキュメントのIDと名前を登録
// 5. testConnection() → syncDocsToDify() の順に実行テスト
// 6. トリガーで毎日自動実行を設定
// ============================================================

// ─── 同期したいGoogleドキュメントの設定 ───
// スクリプトプロパティに以下の形式で登録:
//   プロパティ: DOC_1
//   値:         ドキュメントID:ドキュメント名
//
// 例:
//   DOC_1  →  1AbCdEfGhIjKlMnOpQrStUvWxYz:IT・システム関連FAQ
//   DOC_2  →  2BcDeFgHiJkLmNoPqRsTuVwXyZ:人事・労務FAQ
//   DOC_3  →  3CdEfGhIjKlMnOpQrStUvWxYzA:経理・精算FAQ
//   DOC_4  →  4DeFgHiJkLmNoPqRsTuVwXyZaB:総務・施設FAQ
//   DOC_5  →  5EfGhIjKlMnOpQrStUvWxYzAbC:社内規定FAQ
//
// ドキュメントIDの確認方法:
//   GoogleドキュメントのURL https://docs.google.com/document/d/XXXXX/edit
//   XXXXX の部分がドキュメントID

function getDocList() {
  var props = PropertiesService.getScriptProperties();
  var docList = [];

  for (var i = 1; i <= 20; i++) {
    var value = props.getProperty("DOC_" + i);
    if (!value) continue;

    var parts = value.split(":");
    if (parts.length >= 2) {
      docList.push({
        id: parts[0].trim(),
        name: parts.slice(1).join(":").trim()  // 名前に「:」が含まれる場合にも対応
      });
    }
  }
  return docList;
}

// ─── 設定値の取得 ───
function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    apiKey: props.getProperty("DIFY_API_KEY"),
    baseUrl: props.getProperty("DIFY_BASE_URL") || "https://api.dify.ai/v1",
    datasetId: props.getProperty("DIFY_DATASET_ID")
  };
}

// ─── メイン処理 ───
function syncDocsToDify() {
  var config = getConfig();
  if (!config.apiKey || !config.datasetId) {
    Logger.log("❌ エラー: スクリプトプロパティを設定してください");
    return;
  }

  Logger.log("=== Difyナレッジ同期開始（Googleドキュメント版）===");
  Logger.log("対象Dataset: " + config.datasetId);

  // Step 1: 既存ドキュメントを全削除
  deleteAllDocuments(config);

  // Step 2: 各Googleドキュメントを読み取ってDifyに登録
  registerDocsFromGoogleDocs(config);

  Logger.log("=== 同期完了 ===");
}

// ─── 既存ドキュメントの全削除 ───
function deleteAllDocuments(config) {
  Logger.log("--- 既存ドキュメントの削除を開始 ---");
  var deletedCount = 0;
  var hasMore = true;

  while (hasMore) {
    var listUrl = config.baseUrl + "/datasets/" + config.datasetId + "/documents?page=1&limit=100";
    var listResponse = UrlFetchApp.fetch(listUrl, {
      method: "get",
      headers: { "Authorization": "Bearer " + config.apiKey },
      muteHttpExceptions: true
    });
    var listData = JSON.parse(listResponse.getContentText());

    if (!listData.data || listData.data.length === 0) {
      hasMore = false;
      break;
    }

    for (var i = 0; i < listData.data.length; i++) {
      var doc = listData.data[i];
      var deleteUrl = config.baseUrl + "/datasets/" + config.datasetId + "/documents/" + doc.id;
      try {
        UrlFetchApp.fetch(deleteUrl, {
          method: "delete",
          headers: { "Authorization": "Bearer " + config.apiKey },
          muteHttpExceptions: true
        });
        deletedCount++;
        Logger.log("  削除: " + doc.name);
      } catch (e) {
        Logger.log("  ⚠️ 削除失敗: " + doc.name + " - " + e.message);
      }
      Utilities.sleep(500);
    }

    if (listData.data.length < 100) { hasMore = false; }
  }
  Logger.log("--- 削除完了: " + deletedCount + "件 ---");
}

// ─── GoogleドキュメントからDifyに登録 ───
function registerDocsFromGoogleDocs(config) {
  Logger.log("--- ドキュメント登録を開始 ---");
  var registeredCount = 0;

  var docList = getDocList();

  if (docList.length === 0) {
    Logger.log("  ⚠️ DOC_1〜DOC_20 のスクリプトプロパティが未設定です");
    return;
  }

  for (var i = 0; i < docList.length; i++) {
    var docInfo = docList[i];

    // Googleドキュメントのテキストを取得
    var docText;
    try {
      var doc = DocumentApp.openById(docInfo.id);
      docText = doc.getBody().getText();
    } catch (e) {
      Logger.log("  ❌ 読み取りエラー: " + docInfo.name + " - " + e.message);
      continue;
    }

    if (!docText || docText.trim().length === 0) {
      Logger.log("  スキップ（内容なし）: " + docInfo.name);
      continue;
    }

    // Difyに登録
    var createUrl = config.baseUrl + "/datasets/" + config.datasetId + "/document/create-by-text";
    var payload = {
      "name": docInfo.name,
      "text": docText,
      "indexing_technique": "high_quality",
      "process_rule": { "mode": "automatic" }
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
        Logger.log("  ✅ 登録成功: " + docInfo.name + "（" + docText.length + "文字）");
      } else {
        Logger.log("  ❌ 登録失敗: " + docInfo.name + " (HTTP " + statusCode + ")");
        Logger.log("     レスポンス: " + response.getContentText().substring(0, 200));
      }
    } catch (e) {
      Logger.log("  ❌ 登録エラー: " + docInfo.name + " - " + e.message);
    }

    Utilities.sleep(1000);
  }
  Logger.log("--- 登録完了: " + registeredCount + "件 ---");
}

// ─── 接続テスト ───
function testConnection() {
  var config = getConfig();
  if (!config.apiKey || !config.datasetId) {
    Logger.log("❌ スクリプトプロパティが未設定です");
    return;
  }
  var url = config.baseUrl + "/datasets/" + config.datasetId + "/documents?page=1&limit=5";
  var response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { "Authorization": "Bearer " + config.apiKey },
    muteHttpExceptions: true
  });
  Logger.log("HTTP Status: " + response.getResponseCode());
  Logger.log("Response: " + response.getContentText().substring(0, 500));
}
