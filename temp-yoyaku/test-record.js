const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = 'appDa0WzvXiPtUpht';
const TABLE_NAME = encodeURIComponent('内見予約');

async function test() {
    try {
        const id = 'RSV-20260318-4794';
        const filter = encodeURIComponent(`{受付番号}='${id}'`);
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?filterByFormula=${filter}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        const data = await response.json();
        if (data.records && data.records.length > 0) {
            console.log(`--- DATA for ${id} ---`);
            console.log(JSON.stringify(data.records[0].fields, null, 2));
        } else {
            console.log('Record not found.');
        }
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}

test();
