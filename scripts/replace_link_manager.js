const fs = require('fs');

const contents = fs.readFileSync('c:/Users/phamm/Desktop/Dify構築/ポートフォリオサイト/admin/link-manager.html', 'utf8');

// We will rewrite the link-manager.html to use Supabase instead of localStorage.
let updated = contents.replace("</head>", `  <!-- Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>`);

updated = updated.replace("const STORAGE_KEY = 'portfolio_url_history';", `const STORAGE_KEY = 'portfolio_url_history';
    
    // Supabase Configuration
    const supabaseUrl = 'https://muipdtgspcnonsysdefj.supabase.co';
    const supabaseKey = 'sb_publishable_-68W9V_oUnBz9ejUpKsCaw_cGl1Wnsy';
    const supabase = supabaseBrowser.createClient(supabaseUrl, supabaseKey);`);
    
updated = updated.replace(/const supabase = supabaseBrowser\.createClient/g, "const supabase = window.supabase.createClient");

const newFunctions = `
    // --- Functions ---
    async function getHistory() {
      try {
        const { data, error } = await supabase
          .from('url_history')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching history:', err);
        showToast('履歴の取得に失敗しました');
        return [];
      }
    }

    async function saveEntryToDb(entry) {
      try {
        const { error } = await supabase
          .from('url_history')
          .insert([
            {
              id: entry.id,
              company: entry.company,
              url: entry.url,
              created_at: entry.date
            }
          ]);
        if (error) throw error;
      } catch (err) {
        console.error('Error saving entry:', err);
        showToast('履歴の保存に失敗しました');
      }
    }
    
    async function deleteEntryFromDb(id) {
      try {
        const { error } = await supabase
          .from('url_history')
          .delete()
          .eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Error deleting entry:', err);
        showToast('履歴の削除に失敗しました');
      }
    }
    
    async function deleteAllFromDb() {
      try {
        // RLS might prevent deleting all without filtering, but we'll try
        const { error } = await supabase
          .from('url_history')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw error;
      } catch (err) {
        console.error('Error clearing history:', err);
        showToast('履歴の消去に失敗しました');
      }
    }
`;

updated = updated.replace(/\/\/ --- Functions ---\s*function getHistory\(\) \{[\s\S]*?\}\s*function saveHistory\(history\) \{[\s\S]*?\}/, newFunctions);

updated = updated.replace(/function deleteEntry\(id\) \{[\s\S]*?\}\s*function formatDate/g, `async function deleteEntry(id) {
      if (confirm('この履歴を削除しますか？')) {
        await deleteEntryFromDb(id);
        await renderTable();
      }
    }

    function formatDate`);

updated = updated.replace(/function renderTable\(\) \{[\s\S]*?const history = getHistory\(\);/g, `async function renderTable() {
      const history = await getHistory();`);

updated = updated.replace(/form\.addEventListener\('submit', \(e\) => \{[\s\S]*?const history = getHistory\(\);[\s\S]*?history\.push\(newEntry\);[\s\S]*?saveHistory\(history\);/g, `form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const company = document.getElementById('company').value.trim();
      const source = document.getElementById('source').value.trim();
      const medium = document.getElementById('medium').value.trim();

      if (!company) return;

      const url = generateURL(company, source, medium);
      const newEntry = {
        id: crypto.randomUUID(),
        company,
        url,
        date: new Date().toISOString()
      };

      await saveEntryToDb(newEntry);`);
      
updated = updated.replace(/renderTable\(\);[\s\S]*?copyToClipboard\(url\);/g, `await renderTable();
      copyToClipboard(url);`);
      
updated = updated.replace(/clearAllBtn\.addEventListener\('click', \(\) => \{[\s\S]*?if \(!?getHistory\(\)\.length === 0\) return;[\s\S]*?if \(confirm\('すべての履歴を完全に削除してもよろしいですか？'\)\) \{[\s\S]*?localStorage\.removeItem\(STORAGE_KEY\);[\s\S]*?renderTable\(\);[\s\S]*?showToast\('履歴を全消去しました'\);[\s\S]*?\}[\s\S]*?\}\);/g, `clearAllBtn.addEventListener('click', async () => {
      const history = await getHistory();
      if (history.length === 0) return;
      if (confirm('すべての履歴を完全に削除してもよろしいですか？')) {
        await deleteAllFromDb();
        await renderTable();
        showToast('履歴を全消去しました');
      }
    });`);

fs.writeFileSync('c:/Users/phamm/Desktop/Dify構築/ポートフォリオサイト/admin/link-manager.html', updated, 'utf8');
console.log('Done replacement link-manager.html');