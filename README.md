# Brainz Frontend

A premium AI chat frontend for Brainz, developed by Neuritas-AI, built with Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Zustand, React Markdown, and Sonner.

## Run locally

1. Copy the environment template:
   `cp .env.example .env.local`
2. Set your Ollama/ngrok endpoint in `NEXT_PUBLIC_API_URL`.
3. Install dependencies:
   `npm install`
4. Start the app:
   `npm run dev`

The app is ready to connect to:
`/api/chat`

Expected request payload:

```json
{
  "message": "Hello"
}
```

Expected response:

```json
{
  "response": "Hello, how can I help you?"
}
```
