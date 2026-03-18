const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const AIRTABLE_BASE_ID = 'appDa0WzvXiPtUpht';
const TABLE_NAME = encodeURIComponent('内見予約');

async function test() {
    try {
        const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}?maxRecords=1`;
        console.log(`Fetching from: ${url}`);
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        const data = await response.json();
        if (data.records && data.records.length > 0) {
            console.log('--- FIELDS FOUND ---');
            console.log(JSON.stringify(Object.keys(data.records[0].fields), null, 2));
            console.log('--- DATA SAMPLE ---');
            console.log(JSON.stringify(data.records[0].fields, null, 2));
        } else {
            console.log('No records found or error:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}

test();
