const fs = require('fs');
const path = require('path');

const basePath = 'c:/Users/phamm/Desktop/Dify構築/ポートフォリオサイト';
const oldUrl = /https:\/\/portfolio-site-eight-sepia-66\.vercel\.app/g;
const newUrl = 'https://portfolio-site-4559.vercel.app';

function replaceUrl(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(oldUrl, newUrl);
    fs.writeFileSync(filePath, content, 'utf8');
}

// 1. URL replacements
const filesToUpdate = [
    'index.html',
    'projects/chatbot-service.html',
    'projects/faq-assistant.html',
    'projects/internal-ai.html',
    'projects/menu-allergy.html',
    'projects/real-estate.html',
    'projects/resident-support.html'
];
filesToUpdate.forEach(f => replaceUrl(path.join(basePath, f)));

// 2. Link Manager update
const linkManagerPath = path.join(basePath, 'admin/link-manager.html');
let contents = fs.readFileSync(linkManagerPath, 'utf8');
contents = contents.replace(oldUrl, newUrl);

// Head Supabase script
contents = contents.replace("</head>", `  <!-- Supabase -->\n  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>`);

// Supabase config
contents = contents.replace("const STORAGE_KEY = 'portfolio_url_history';", `const STORAGE_KEY = 'portfolio_url_history';
    
    // Supabase Configuration
    const supabaseUrl = 'https://muipdtgspcnonsysdefj.supabase.co';
    const supabaseKey = 'sb_publishable_-68W9V_oUnBz9ejUpKsCaw_cGl1Wnsy';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);`);

// Functions replacement block
const oldFunctionsStart = "// --- Functions ---";
const eventListenersStart = "// --- Event Listeners ---";

const beforeFuncs = contents.substring(0, contents.indexOf(oldFunctionsStart));
const afterFuncs = contents.substring(contents.indexOf(eventListenersStart));

const newFunctions = `// --- Functions ---
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

    function generateURL(company, source, medium) {
      const url = new URL(BASE_URL);
      url.searchParams.set('utm_source', source);
      url.searchParams.set('utm_medium', medium);
      url.searchParams.set('utm_campaign', company);
      return url.toString();
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('URLをコピーしました！');
      }).catch(err => {
        console.error('Copy failed', err);
        alert('コピーに失敗しました。');
      });
    }

    async function deleteEntry(id) {
      if (confirm('この履歴を削除しますか？')) {
        await deleteEntryFromDb(id);
        await renderTable();
      }
    }

    function formatDate(isoString) {
      const date = new Date(isoString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    async function renderTable() {
      const history = await getHistory();
      tableBody.innerHTML = '';

      if (history.length === 0) {
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';

      history.forEach(item => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = \`
          <td class="company-name">\${item.company}</td>
          <td class="date-cell">\${formatDate(item.created_at)}</td>
          <td class="url-cell" title="\${item.url}">\${item.url}</td>
          <td class="actions">
             <button class="btn btn-sm btn-copy" onclick="copyToClipboard('\${item.url}')">コピー</button>
             <button class="btn btn-danger" onclick="deleteEntry('\${item.id}')" title="削除">✖</button>
          </td>
        \`;
        tableBody.appendChild(tr);
      });
    }

    `;

contents = beforeFuncs + newFunctions + afterFuncs;

// Fix event listeners
contents = contents.replace(`form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const company = document.getElementById('company').value.trim();
      const source = document.getElementById('source').value.trim();
      const medium = document.getElementById('medium').value.trim();

      if (!company) return;

      const url = generateURL(company, source, medium);
      const newEntry = {
        id: Date.now().toString(),
        company,
        url,
        date: new Date().toISOString()
      };

      const history = getHistory();
      history.push(newEntry);
      saveHistory(history);

      renderTable();
      copyToClipboard(url);
      
      // Clear input
      document.getElementById('company').value = '';
    });`, `form.addEventListener('submit', async (e) => {
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

      await saveEntryToDb(newEntry);

      await renderTable();
      copyToClipboard(url);
      
      // Clear input
      document.getElementById('company').value = '';
    });`);

contents = contents.replace(`clearAllBtn.addEventListener('click', () => {
      if (getHistory().length === 0) return;
      if (confirm('すべての履歴を完全に削除してもよろしいですか？')) {
        localStorage.removeItem(STORAGE_KEY);
        renderTable();
        showToast('履歴を全消去しました');
      }
    });`, `clearAllBtn.addEventListener('click', async () => {
      const history = await getHistory();
      if (history.length === 0) return;
      if (confirm('すべての履歴を完全に削除してもよろしいですか？')) {
        await deleteAllFromDb();
        await renderTable();
        showToast('履歴を全消去しました');
      }
    });`);

fs.writeFileSync(linkManagerPath, contents, 'utf8');
console.log('Successfully replaced link-manager with Supabase using safe string replacement');
