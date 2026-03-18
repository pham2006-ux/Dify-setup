#!/usr/bin/env node
/**
 * MCP Server: Portfolio Tracking URL Manager
 * ==========================================
 * Supabaseと連携してトラッキングURLを管理するMCPサーバー
 * 
 * 利用可能なツール:
 *   - generate_tracking_url  : 会社名からトラッキングURLを生成してSupabaseに保存
 *   - list_tracking_urls     : 発行済みURLの一覧を取得
 *   - delete_tracking_url    : 指定IDのURLを削除
 *   - delete_all_urls        : 全URLを削除
 *   - bulk_generate_urls     : 複数会社のURLを一括生成
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// --- 設定 ---
const SUPABASE_URL = 'https://muipdtgspcnonsysdefj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_-68W9V_oUnBz9ejUpKsCaw_cGl1Wnsy';
const BASE_URL = 'https://portfolio-site-copy.vercel.app/';
const UTM_SOURCE = 'email';
const UTM_MEDIUM = 'outreach';

// --- Supabaseクライアント ---
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- MCPサーバー初期化 ---
const server = new McpServer({
  name: 'mcp-url-tracker',
  version: '1.0.0',
});

// --- ヘルパー関数 ---
function generateURL(company) {
  const url = new URL(BASE_URL);
  url.searchParams.set('utm_source', UTM_SOURCE);
  url.searchParams.set('utm_medium', UTM_MEDIUM);
  url.searchParams.set('utm_campaign', company);
  return url.toString();
}

// --- ツール定義 ---

// 1. 単一URL生成
server.tool(
  'generate_tracking_url',
  '会社名からトラッキングURLを生成してSupabaseに保存し、URLを返す',
  {
    company: z.string().describe('営業先の会社名（例: 株式会社トヨタ）'),
  },
  async ({ company }) => {
    const url = generateURL(company);
    const { error } = await supabase.from('url_history').insert([{
      company,
      url,
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      return { content: [{ type: 'text', text: `エラー: ${error.message}` }] };
    }

    return {
      content: [{
        type: 'text',
        text: `✅ URL生成完了\n会社名: ${company}\nURL: ${url}`,
      }],
    };
  }
);

// 2. URL一覧取得
server.tool(
  'list_tracking_urls',
  '発行済みトラッキングURLの一覧をSupabaseから取得する',
  {},
  async () => {
    const { data, error } = await supabase
      .from('url_history')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { content: [{ type: 'text', text: `エラー: ${error.message}` }] };
    }

    if (!data || data.length === 0) {
      return { content: [{ type: 'text', text: '履歴はまだありません。' }] };
    }

    const lines = data.map((item, i) =>
      `${i + 1}. [${item.id}]\n   会社: ${item.company}\n   URL: ${item.url}\n   作成: ${new Date(item.created_at).toLocaleString('ja-JP')}`
    );

    return {
      content: [{
        type: 'text',
        text: `📋 発行済みURL一覧 (${data.length}件)\n\n${lines.join('\n\n')}`,
      }],
    };
  }
);

// 3. 単一URL削除
server.tool(
  'delete_tracking_url',
  '指定IDのトラッキングURLをSupabaseから削除する',
  {
    id: z.string().describe('削除するレコードのUUID'),
  },
  async ({ id }) => {
    const { error } = await supabase.from('url_history').delete().eq('id', id);

    if (error) {
      return { content: [{ type: 'text', text: `エラー: ${error.message}` }] };
    }

    return { content: [{ type: 'text', text: `✅ ID: ${id} を削除しました。` }] };
  }
);

// 4. 全URL削除
server.tool(
  'delete_all_urls',
  '全トラッキングURLをSupabaseから削除する（注意: 元に戻せません）',
  {
    confirm: z.boolean().describe('削除を確認する場合はtrueを指定'),
  },
  async ({ confirm }) => {
    if (!confirm) {
      return { content: [{ type: 'text', text: '削除をキャンセルしました。confirmをtrueに設定してください。' }] };
    }

    const { error } = await supabase
      .from('url_history')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      return { content: [{ type: 'text', text: `エラー: ${error.message}` }] };
    }

    return { content: [{ type: 'text', text: '✅ 全履歴を削除しました。' }] };
  }
);

// 5. 複数会社を一括生成
server.tool(
  'bulk_generate_urls',
  '複数会社のトラッキングURLを一括生成してSupabaseに保存する',
  {
    companies: z.array(z.string()).describe('会社名の配列（例: ["菱信商事", "ARES（アレス）"]）'),
    clear_existing: z.boolean().optional().describe('既存のURLを全削除してから挿入する場合はtrue（デフォルト: false）'),
  },
  async ({ companies, clear_existing }) => {
    if (clear_existing) {
      const { error: delError } = await supabase
        .from('url_history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (delError) {
        return { content: [{ type: 'text', text: `削除エラー: ${delError.message}` }] };
      }
    }

    const now = new Date().toISOString();
    const records = companies.map(company => ({
      company,
      url: generateURL(company),
      created_at: now,
    }));

    const { data, error } = await supabase
      .from('url_history')
      .insert(records)
      .select();

    if (error) {
      return { content: [{ type: 'text', text: `挿入エラー: ${error.message}` }] };
    }

    const lines = (data || records).map((item, i) =>
      `${i + 1}. ${item.company}\n   ${item.url}`
    );

    return {
      content: [{
        type: 'text',
        text: `✅ ${companies.length}社のURL生成完了\n\n${lines.join('\n\n')}`,
      }],
    };
  }
);

// --- サーバー起動 ---
const transport = new StdioServerTransport();
await server.connect(transport);
