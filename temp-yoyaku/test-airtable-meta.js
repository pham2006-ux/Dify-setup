const AIRTABLE_TOKEN = 'patM5FS3nKGprposV';

async function test() {
    try {
        console.log('Testing Token with /v0/meta/bases...');
        const response = await fetch('https://api.airtable.com/v0/meta/bases', {
            headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` }
        });
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Test failed:', e.message);
    }
}

test();
