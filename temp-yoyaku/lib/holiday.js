const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const CALENDAR_ID = 'japanese__ja@holiday.calendar.google.com';

/**
 * Checks if a given date is a public holiday in Japan.
 * @param {Date} date - The date to check (in JST).
 * @returns {Promise<{isHoliday: boolean, name: string | null}>}
 */
export async function checkJapaneseHoliday(date) {
  // Use YYYY-MM-DD format for comparison
  const targetDateStr = date.toISOString().split('T')[0];
  
  // Set time range for the specific day to minimize API response size
  const timeMin = new Date(date);
  timeMin.setUTCHours(0, 0, 0, 0);
  const timeMax = new Date(date);
  timeMax.setUTCHours(23, 59, 59, 999);

  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${GOOGLE_API_KEY}&timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true`;
    
    const res = await fetch(url);
    if (!res.ok) {
      console.error('Google Calendar API error:', await res.text());
      return { isHoliday: false, name: null };
    }

    const data = await res.json();
    const holidays = data.items || [];
    
    // Find an event that matches the date
    const holiday = holidays.find(item => {
      const start = item.start.date || item.start.dateTime;
      return start.startsWith(targetDateStr);
    });

    if (holiday) {
      return { isHoliday: true, name: holiday.summary };
    }
    
    return { isHoliday: false, name: null };
  } catch (error) {
    console.error('Failed to fetch holidays:', error);
    return { isHoliday: false, name: null };
  }
}
