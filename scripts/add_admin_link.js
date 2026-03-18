const fs = require('fs');

const path = 'c:/Users/phamm/Desktop/Dify構築/ポートフォリオサイト/index.html';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('admin/link-manager.html')) {
    content = content.replace(
        '<p>&copy; 2026 ファム ミンフィー All Rights Reserved.</p>',
        '<p>&copy; 2026 ファム ミンフィー All Rights Reserved. <a href="admin/link-manager.html" style="color: #666; text-decoration: none; margin-left: 10px; font-size: 0.8rem; transition: color 0.3s;" onmouseover="this.style.color=\'#fff\'" onmouseout="this.style.color=\'#666\'">[URL管理]</a></p>'
    );
    fs.writeFileSync(path, content, 'utf8');
    console.log('Added admin link to index.html');
} else {
    console.log('Link already exists');
}