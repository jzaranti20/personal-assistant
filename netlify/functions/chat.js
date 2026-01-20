// Netlify serverless function to proxy requests to Claude API
// This keeps your API key secure on the server side

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { messages, system } = JSON.parse(event.body);

    // Get API key from environment variable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'API key not configured. Please set ANTHROPIC_API_KEY in your Netlify environment variables.' 
        }),
      };
    }

    // System prompt for Jazzy
    const systemPrompt = system || `You are Jazzy, a friendly and helpful personal assistant. You help with tasks, reminders, calendar management, and general questions.

Keep your responses concise and conversational - you're being used in a voice interface, so shorter responses work better. Be warm and personable.

The user is John Zaranti. He uses Apple Reminders for personal tasks and Google Tasks for work tasks. He has a family calendar (iCloud) and work calendar (Google).`;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', errorData);
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: errorData.error?.message || `API error: ${response.status}` 
        }),
      };
    }

    const data = await response.json();
    
    // Extract the text content from Claude's response
    const content = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        content,
        model: data.model,
        usage: data.usage,
      }),
    };
  } catch (error) {
    console.error('Function error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
    };
  }
}
