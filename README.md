<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TONUS - Emotion Tracking App

This app uses Claude AI for emotion analysis and mental wellness tips.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Anthropic API key in [.env.local](.env.local):
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Getting Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in to your account
3. Navigate to **API Keys** in the left sidebar
4. Click **Create Key**
5. Copy the key (starts with `sk-ant-...`)
6. Paste it in your `.env.local` file

**Note:** For production use, you should use a backend proxy to protect your API key. Exposing it in frontend code is only suitable for development/demos.
