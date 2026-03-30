import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://muipdtgspcnonsysdefj.supabase.co';
const supabaseKey = 'sb_publishable_-68W9V_oUnBz9ejUpKsCaw_cGl1Wnsy';
const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "mcp-url-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_tracking_url",
        description: "Vercelのポートフォリオサイト用のトラッキングURLを生成します。 UTMパラメータを付与したURLを作成します。",
        inputSchema: {
          type: "object",
          properties: {
            companyName: {
              type: "string",
              description: "会社名 (utm_campaign に設定されます)",
            },
            source: {
              type: "string",
              description: "流入元 (utm_source に設定されます。デフォルトは 'email')",
              default: "email"
            },
            medium: {
              type: "string",
              description: "媒体 (utm_medium に設定されます。デフォルトは 'direct_sales')",
              default: "direct_sales"
            }
          },
          required: ["companyName"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate_tracking_url") {
    const { companyName, source = "email", medium = "direct_sales" } = request.params.arguments;
    
    // サイトのベースURL
    const BASE_URL = 'https://my-portfolio-site-kappa-sooty.vercel.app/';
    const url = new URL(BASE_URL);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', medium);
    url.searchParams.set('utm_campaign', companyName);
    
    const trackingUrl = url.toString();
    const entryId = Date.now().toString() + Math.random().toString(36).substring(7);
    const dateStr = new Date().toISOString();
    
    try {
      const { error } = await supabase
        .from('url_history')
        .insert([
          {
            
            company: companyName,
            url: trackingUrl,
            created_at: dateStr
          }
        ]);
        
      if (error) {
        console.error("Supabase insert error:", error);
        return {
          content: [
            {
              type: "text",
              text: `生成されたトラッキングURL: ${trackingUrl}\n\n【エラー】URLは生成されましたが、Supabaseデータベースへの保存に失敗しました。(${error.message})`,
            },
          ],
        };
      }
    } catch (err) {
      console.error("Supabase request failed:", err);
    }
    
    return {
      content: [
        {
          type: "text",
          text: `生成されたトラッキングURL: ${trackingUrl}\n\n✅ Supabaseデータベースにも履歴が保存され、サイト上の「link-manager.html」に同期されました！`,
        },
      ],
    };
  }
  
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("URL Generator MCP Server running on stdio");
}

run().catch(console.error);
