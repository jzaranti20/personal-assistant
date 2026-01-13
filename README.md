# Atlas - Personal AI Assistant

A modern, elegant personal assistant web app powered by Claude. Features both chat and voice interaction modes, with a beautiful glass-morphism UI.

![Atlas Preview](preview.png)

## Features

- **Chat Mode**: Traditional text-based conversation with Claude
- **Voice Mode**: Hands-free voice interaction with speech-to-text and text-to-speech
- **Beautiful UI**: Glass-morphism design with smooth animations
- **Responsive**: Works on desktop, tablet, and mobile
- **Secure**: API key stored server-side via Netlify Functions
- **Fast**: Built with Vite and React for optimal performance

## Quick Start

### Prerequisites

- Node.js 18+ installed
- An Anthropic API key ([Get one here](https://console.anthropic.com/))
- A Netlify account ([Sign up here](https://netlify.com))

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd personal-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **For local Netlify Functions testing**
   ```bash
   npm install -g netlify-cli
   netlify dev
   ```

## Deploying to Netlify

### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize the site**
   ```bash
   netlify init
   ```
   - Choose "Create & configure a new site"
   - Select your team
   - Choose a site name (or let Netlify generate one)

4. **Set your environment variable**
   ```bash
   netlify env:set ANTHROPIC_API_KEY "sk-ant-api03-your-key-here"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

### Option 2: Deploy via GitHub + Netlify UI

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Netlify**
   - Go to [Netlify Dashboard](https://app.netlify.com/)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub account and select your repository
   - Build settings should auto-detect from `netlify.toml`

3. **Add Environment Variable**
   - Go to Site settings → Environment variables
   - Add: `ANTHROPIC_API_KEY` = `your-api-key`

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy automatically

### Option 3: One-Click Deploy

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=YOUR_REPO_URL)

After clicking, you'll be prompted to:
1. Connect your GitHub account
2. Enter your `ANTHROPIC_API_KEY`
3. Deploy!

## Project Structure

```
personal-assistant/
├── index.html              # HTML entry point
├── netlify.toml            # Netlify configuration
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite build configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── .env.example            # Environment variable template
├── public/
│   └── favicon.svg         # App icon
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main application component
│   ├── index.css          # Global styles
│   ├── components/
│   │   ├── Header.jsx         # App header with mode toggle
│   │   ├── ChatMessage.jsx    # Message bubble component
│   │   ├── ChatInput.jsx      # Input with voice support
│   │   ├── VoiceMode.jsx      # Voice-first interface
│   │   ├── WelcomeScreen.jsx  # Initial welcome view
│   │   └── SettingsModal.jsx  # Settings dialog
│   ├── hooks/
│   │   ├── useSpeechRecognition.js  # Speech-to-text hook
│   │   └── useSpeechSynthesis.js    # Text-to-speech hook
│   └── utils/
│       └── api.js         # API communication utilities
└── netlify/
    └── functions/
        └── chat.js        # Serverless function for Claude API
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key |
| `CLAUDE_MODEL` | No | Claude model to use (default: claude-sonnet-4-20250514) |

### Customization

**Change the assistant name:**
Edit `src/utils/api.js` and update the system prompt.

**Modify the theme:**
Edit `tailwind.config.js` to change colors, fonts, and animations.

**Add new features:**
The modular component structure makes it easy to add new functionality.

## Browser Support

- Chrome 60+ (full voice support)
- Firefox 60+ (limited voice support)
- Safari 14+ (full voice support)
- Edge 80+ (full voice support)

Note: Voice features require browser support for the Web Speech API.

## Troubleshooting

**"API key not configured" error:**
- Ensure `ANTHROPIC_API_KEY` is set in Netlify environment variables
- Redeploy after adding the environment variable

**Voice not working:**
- Check browser permissions for microphone access
- Ensure you're using HTTPS (required for Web Speech API)
- Try a different browser if issues persist

**Build failures:**
- Ensure Node.js 18+ is being used
- Run `npm install` locally to check for dependency issues

## Future Enhancements

This is just the beginning! Here are some integrations we can add:

- [ ] Google Calendar integration
- [ ] Task management (Todoist, Notion)
- [ ] Email integration
- [ ] Weather information
- [ ] News updates
- [ ] Smart home controls
- [ ] File upload and processing
- [ ] Image generation
- [ ] Web search capabilities

## License

MIT License - feel free to use this for personal or commercial projects.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ using Claude, React, and Netlify
