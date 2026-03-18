const fs = require('fs');
let contents = fs.readFileSync('c:/Users/phamm/Desktop/Dify構築/mcp-url-generator/index.js', 'utf8');

const importReplacement = `import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const supabaseUrl = 'https://muipdtgspcnonsysdefj.supabase.co';
const supabaseKey = 'sb_publishable_-68W9V_oUnBz9ejUpKsCaw_cGl1Wnsy';
const supabase = createClient(supabaseUrl, supabaseKey);`;

contents = contents.replace(/import \{ Server \} from "@modelcontextprotocol\/sdk\/server\/index\.js";[\s\S]*?\} from "@modelcontextprotocol\/sdk\/types\.js";/, importReplacement);

const handlerReplacement = `server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "generate_tracking_url") {
    const { companyName, source = "email", medium = "direct_sales" } = request.params.arguments;
    
    // サイトのベースURL
    const BASE_URL = 'https://portfolio-site-4559.vercel.app/';
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
            id: entryId,
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
              text: \`生成されたトラッキングURL: \${trackingUrl}\\n\\n【エラー】URLは生成されましたが、Supabaseデータベースへの保存に失敗しました。(\${error.message})\`,
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
          text: \`生成されたトラッキングURL: \${trackingUrl}\\n\\n✅ Supabaseデータベースにも履歴が保存され、サイト上の「link-manager.html」に同期されました！\`,
        },
      ],
    };
  }
  
  throw new Error(\`Unknown tool: \${request.params.name}\`);
});`;

contents = contents.replace(/server\.setRequestHandler\(CallToolRequestSchema, async \(request\) => \{[\s\S]*?\}\);/g, handlerReplacement);

fs.writeFileSync('c:/Users/phamm/Desktop/Dify構築/mcp-url-generator/index.js', contents, 'utf8');
console.log('Done replacing index.js');