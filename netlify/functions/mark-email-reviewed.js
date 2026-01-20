// Netlify function to mark email as reviewed
// 1. Sends to Zapier webhook (for Gmail marking)
// 2. Deletes row from Google Sheet directly

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
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { threadId, messageId, rowIndex } = JSON.parse(event.body || '{}');

    if (!rowIndex) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Row index is required' }),
      };
    }

    // 1. Send to Zapier webhook (for Gmail mark as read - may not work but try)
    const webhookUrl = process.env.ZAPIER_EMAIL_REVIEWED_WEBHOOK || 'https://hooks.zapier.com/hooks/catch/18331363/ugmcfwv/';
    
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: threadId,
          messageId: messageId,
          rowIndex: rowIndex,
        }),
      });
    } catch (webhookError) {
      console.error('Zapier webhook error (non-fatal):', webhookError);
      // Continue anyway - sheet deletion is more important
    }

    // 2. Delete row from Google Sheet directly
    const sheetId = process.env.GOOGLE_SHEET_ID || '1G1ZxTmNngGoy8H9a3cyZwXTLef2d8NaWtHVlaU6V038';
    const sheetName = 'Jazzy Email';
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Service account not configured' }),
      };
    }

    const credentials = JSON.parse(serviceAccountKey);
    const token = await getAccessToken(credentials);

    // First, get the sheet ID (gid)
    const sheetInfoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}`;
    const sheetInfoResponse = await fetch(sheetInfoUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    if (!sheetInfoResponse.ok) {
      throw new Error('Failed to get sheet info');
    }
    
    const sheetInfo = await sheetInfoResponse.json();
    const sheet = sheetInfo.sheets.find(s => s.properties.title === sheetName);
    
    if (!sheet) {
      throw new Error('Sheet not found');
    }
    
    const sheetGid = sheet.properties.sheetId;

    // Delete the row using batchUpdate
    const deleteUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheetGid,
              dimension: 'ROWS',
              startIndex: rowIndex - 1, // 0-indexed
              endIndex: rowIndex, // exclusive
            }
          }
        }]
      }),
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.text();
      console.error('Sheet delete error:', error);
      throw new Error('Failed to delete row from sheet');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
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
    scope: 'https://www.googleapis.com/auth/spreadsheets',
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
