const fs = require('fs');
const css = `
/* ----------- Added for images ----------- */
.profile-img-container { margin-bottom: 24px; }
.profile-img { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid var(--primary); box-shadow: 0 8px 20px rgba(108, 99, 255, 0.3); display: block; }
.card-img { margin: -24px -24px 20px -24px; overflow: hidden; border-top-left-radius: 12px; border-top-right-radius: 12px; }
.card-img img { width: 100%; display: block; object-fit: cover; transition: transform 0.3s ease; }
.card:hover .card-img img { transform: scale(1.05); }
.detail-hero-img-container { margin-top: 40px; text-align: center; }
.detail-hero-img { max-width: 100%; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 1px solid var(--border); }
`;
fs.appendFileSync('c:/Users/phamm/Desktop/Dify構築/ポートフォリオサイト/css/style.css', css, 'utf8');
console.log('CSS appended!');
