// Netlify function to add a reminder to Google Sheets "Add to Apple" tab

export async function handler(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { task, dueDate, list } = JSON.parse(event.body);
    
    if (!task) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task is required' }),
      };
    }

    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = 'Add to Apple';
    
    if (!apiKey || !spreadsheetId) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Google Sheets not configured' }),
      };
    }

    // Format the date
    const now = new Date();
    const createdAt = `${now.getMonth() + 1}/${now.getDate()}`;
    
    // We need to use a service account for write access
    // For now, we'll use the Google Sheets API with OAuth
    // This requires a service account key
    
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    
    if (!serviceAccountKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Service account not configured' }),
      };
    }

    // Parse the service account key
    const credentials = JSON.parse(serviceAccountKey);
    
    // Create JWT for authentication
    const jwt = await createJWT(credentials);
    
    // Get access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to authenticate with Google' }),
      };
    }

    const { access_token } = await tokenResponse.json();

    // Append row to sheet
    const range = `${sheetName}!A:F`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;
    
    const appendResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[
          '', // ID - leave blank
          task,
          dueDate || '',
          list || 'Family Reminders', // Default to Family Reminders
          '', // Completed - leave blank
          createdAt,
        ]],
      }),
    });

    if (!appendResponse.ok) {
      const error = await appendResponse.text();
      console.error('Append error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to add reminder' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Reminder added!' }),
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

// Helper function to create JWT
async function createJWT(credentials) {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const signature = await sign(signatureInput, credentials.private_key);
  
  return `${signatureInput}.${signature}`;
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function sign(input, privateKey) {
  const crypto = await import('crypto');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(input);
  const signature = sign.sign(privateKey, 'base64');
  return signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
