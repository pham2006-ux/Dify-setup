import { NextResponse } from 'next/server';

const CALENDAR_ID = 'japanese__ja@holiday.calendar.google.com';

export async function GET() {
  const apiKey = process.env.GOOGLE_API_KEY;

  // If no API key, return empty list to avoid breaking the app
  if (!apiKey) {
    console.warn('GOOGLE_API_KEY is not set. Holiday check will be skipped.');
    return NextResponse.json({ holidays: [] });
  }

  const today = new Date();
  const timeMin = today.toISOString();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
  const timeMax = oneYearLater.toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Calendar API Error:", errorData.error?.message);
      return NextResponse.json({ holidays: [] });
    }

    const data = await response.json();
    // Return date strings and holiday names for the UI
    const holidays = (data.items || []).map(item => ({
      date: item.start.date,
      name: item.summary,
    }));
    return NextResponse.json(
      { holidays },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return NextResponse.json({ holidays: [] });
  }
}
