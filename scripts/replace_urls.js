const fs = require('fs');

const contents = fs.readFileSync('c:/Users/phamm/Desktop/Dify構築/営業資料_提案リスト/地域密着型不動産_追加15社_営業文一覧.md', {encoding: 'utf-8'});
const BASE_URL = 'https://portfolio-site-4559.vercel.app/';

const companies = [
  { name: '菱信商事', keyword: '菱信商事 様' },
  { name: 'ARES', keyword: 'ARES 様' },
  { name: '株式会社リスム千葉店', keyword: '株式会社リスム千葉店 様' },
  { name: 'センチュリー21五大ホーム', keyword: 'センチュリー21五大ホーム 様' },
  { name: '賃貸スマイル本八幡店', keyword: '賃貸スマイル本八幡店 様' },
  { name: '株式会社さくら都市', keyword: '株式会社さくら都市 様' },
  { name: 'ネクスト・ドア', keyword: 'ネクスト・ドア 様' },
  { name: '東和不動産', keyword: '東和不動産 様' },
  { name: 'みつみね不動産', keyword: 'みつみね不動産 様' },
  { name: '白幡興業', keyword: '白幡興業 様' },
  { name: '株式会社東関東ドットCOM', keyword: '株式会社東関東ドットCOM 様' },
  { name: '有限会社緑園', keyword: '有限会社緑園 様' },
  { name: '有限会社ミライアン不動産', keyword: '有限会社ミライアン不動産 様' },
  { name: '不動産SHOPナカジツ 船橋北口本店', keyword: '不動産SHOPナカジツ 船橋北口本店 様' },
  { name: '南総キングダム株式会社 千葉土地建物管理 千葉支店', keyword: '南総キングダム株式会社 千葉土地建物管理 千葉支店 様' }
];

let updatedContents = contents;
// Using the new vercel URL globally if it hasn't been replaced yet, or the old one just in case
const oldUrlRegex1 = /https:\/\/peat-gasosaurus-e4e\.notion\.site\/2f8a010077738130827add63f24277a2/g;

// Section by section replacement
const sections = updatedContents.split('---');

let finalOutput = [];

for (let i = 0; i < sections.length; i++) {
    let section = sections[i];
    let matchedCompany = null;
    
    // Find which company this section is for
    for (let company of companies) {
        if (section.includes(company.keyword) && section.includes('件名:')) {
            matchedCompany = company.name;
            break;
        }
    }
    
    if (matchedCompany) {
        const source = 'email';
        const medium = 'direct_sales';
        
        const url = new URL(BASE_URL);
        url.searchParams.set('utm_source', source);
        url.searchParams.set('utm_medium', medium);
        url.searchParams.set('utm_campaign', matchedCompany);
        
        const trackingUrl = url.toString();
        section = section.replace(oldUrlRegex1, trackingUrl);
    }
    
    finalOutput.push(section);
}

fs.writeFileSync('c:/Users/phamm/Desktop/Dify構築/営業資料_提案リスト/地域密着型不動産_追加15社_営業文一覧_URL置換済.md', finalOutput.join('---'), {encoding: 'utf-8'});

// Log entries
const logEntries = companies.map(c => {
    const url = new URL(BASE_URL);
    url.searchParams.set('utm_source', 'email');
    url.searchParams.set('utm_medium', 'direct_sales');
    url.searchParams.set('utm_campaign', c.name);
    return {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        company: c.name,
        url: url.toString(),
        date: new Date().toISOString()
    };
});
fs.writeFileSync('c:/Users/phamm/Desktop/Dify構築/scripts/generated_urls.json', JSON.stringify(logEntries, null, 2), {encoding: 'utf-8'});
console.log('Done replacement.');