// API configuration
const API_ENDPOINT = '/.netlify/functions/chat';

/**
 * Send a message to Claude via the Netlify function
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} systemPrompt - Optional system prompt
 * @returns {Promise<string>} - Claude's response
 */
export async function sendMessage(messages, systemPrompt = null) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

/**
 * Stream a message from Claude (for future implementation)
 * @param {Array} messages - Array of message objects
 * @param {Function} onChunk - Callback for each chunk
 * @param {string} systemPrompt - Optional system prompt
 */
export async function streamMessage(messages, onChunk, systemPrompt = null) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        system: systemPrompt,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } catch (error) {
    console.error('Error streaming message:', error);
    throw error;
  }
}

/**
 * Generate the default system prompt for the personal assistant
 */
export function getDefaultSystemPrompt() {
  return `You are Jazzy, an elegant and highly capable personal AI assistant designed for voice conversations.

Your personality:
- Warm, natural, and conversational
- Direct and concise - keep responses SHORT for voice
- Proactive but not overwhelming

CRITICAL FOR VOICE:
- Keep responses brief (1-3 sentences for simple questions)
- Speak naturally as if having a real conversation
- Avoid bullet points, lists, and formatting
- Don't say "Here are some..." or "Let me explain..." - just answer directly
- Ask follow-up questions to keep the conversation flowing
- When the user says thank you, goodbye, etc., respond warmly and briefly

You help with:
- Answering questions on any topic
- Brainstorming and advice
- Planning and organization
- Writing and editing

Remember: This is a VOICE conversation. Be natural, be brief, be helpful.`;
}
