// Netlify function to fetch work tasks from Google Sheets

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
    const sheetId = process.env.GOOGLE_SHEET_ID || '1G1ZxTmNngGoy8H9a3cyZwXTLef2d8NaWtHVlaU6V038';
    const sheetName = 'Work Tasks';
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

    if (!apiKey) {
      // Try service account method
      const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        return await fetchWithServiceAccount(sheetId, sheetName, serviceAccountKey, headers);
      }
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No API key or service account configured' }),
      };
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Sheets API error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch work tasks' }),
      };
    }

    const data = await response.json();
    const rows = data.values || [];
    
    // Skip header row, parse tasks
    const tasks = rows.slice(1).map((row, index) => ({
      id: `work-task-${index}`,
      title: row[0] || '',
      dueDate: row[1] || '',
      attachment: row[2] || '',
      notes: row[3] || '',
      rowIndex: index + 2, // +2 because of 0-index and header row
    })).filter(task => task.title); // Only include tasks with titles

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tasks }),
    };
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function fetchWithServiceAccount(sheetId, sheetName, serviceAccountKey, headers) {
  try {
    const credentials = JSON.parse(serviceAccountKey);
    const token = await getAccessToken(credentials);
    
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheetName)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Sheets API error:', error);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch work tasks' }),
      };
    }

    const data = await response.json();
    const rows = data.values || [];
    
    const tasks = rows.slice(1).map((row, index) => ({
      id: `work-task-${index}`,
      title: row[0] || '',
      dueDate: row[1] || '',
      attachment: row[2] || '',
      notes: row[3] || '',
      rowIndex: index + 2,
    })).filter(task => task.title);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ tasks }),
    };
  } catch (error) {
    console.error('Service account error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function getAccessToken(credentials) {
  const jwt = await createJWT(credentials);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function createJWT(credentials) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(credentials.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signatureInput}.${signature}`;
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
