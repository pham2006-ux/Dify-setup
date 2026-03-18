
import { NextResponse } from 'next/server';

export async function GET(request) {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
    const TABLE_NAME = encodeURIComponent('内見予約');

    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${TABLE_NAME}`,
            {
                headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
                cache: 'no-store',
            }
        );
        const data = await response.json();

        if (!response.ok) {
             // Forward Airtable's error
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました。', details: err.message },
            { status: 500 }
        );
    }
}
