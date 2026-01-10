// Netlify function to read reminders from Google Sheets

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = 'Apple To Jazzy';
    
    if (!apiKey || !spreadsheetId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Google Sheets not configured' }),
      };
    }

    // Fetch data from Google Sheets API
    const range = `${sheetName}!A2:F100`; // Skip header row, get up to 100 reminders
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Google Sheets API error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch reminders' }),
      };
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Parse rows into reminder objects
    // Columns: ID (A), Task (B), Due Date (C), List (D), Completed (E), Created At (F)
    const reminders = rows
      .map((row, index) => ({
        id: row[0] || `row-${index + 2}`,
        task: row[1] || '',
        dueDate: row[2] || '',
        list: row[3] || '',
        completed: row[4] || '',
        createdAt: row[5] || '',
        rowNumber: index + 2, // For updating/deleting later
      }))
      .filter(r => r.task && !r.completed); // Only return non-completed tasks with a title

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reminders }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Internal server error' }),
    };
  }
}
