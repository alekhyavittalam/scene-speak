# SceneSpeak

SceneSpeak turns short Hindi and French movie phrases into practical lessons about natural meaning, tone, safe usage, and vocabulary. It includes screenshot extraction, local phrase saving, and three-question review quizzes.

## Run locally

This project is pinned to Next.js 13.5 so it works with the workspace's Node 18 runtime.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. The curated Hindi and French sample lessons work without an API key.

## Environment variables

- `OPENAI_API_KEY`: Enables live phrase lessons and screenshot extraction.
- `OPENAI_MODEL`: Defaults to `gpt-5.6-terra` and can be changed without editing code.
- `NEXT_PUBLIC_POSTHOG_KEY`: Optional. Enables anonymous core product events.
- `NEXT_PUBLIC_POSTHOG_HOST`: Optional PostHog host; defaults to the US cloud endpoint.

Never expose `OPENAI_API_KEY` through a `NEXT_PUBLIC_` variable. Requests are made only from server route handlers.

## Commands

```bash
npm run dev
npm run test
npm run lint
npm run build
```

## Product boundaries

- Hindi and French only; explanations are in English.
- One phrase of at most 200 characters.
- JPG, PNG, and WebP screenshots up to 5 MB.
- Saved lessons and quiz history remain in the current browser.
- Uploaded screenshots are processed in memory and are not persisted by the app.
