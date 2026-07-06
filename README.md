# LifeXP

A task manager with an invisible RPG progression layer — tasks earn XP and coins,
skills level up, an optional AI layer scores and plans your day, and a Life
Heatmap turns your history into a visual record instead of just a log.

Everything runs entirely client-side. There is no backend server and no
database — all data (tasks, XP, settings, history) lives in this browser's
`localStorage`, under the key `lifexp-data-v2`.

## Project structure

```
lifexp/
├── index.html          Markup only — no inline styles or scripts
├── manifest.json        PWA manifest (name, icons, theme colour)
├── css/
│   └── styles.css       All styling
├── js/
│   └── app.js           All application logic — GOOGLE_CLIENT_ID lives here
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── icon-180.png
└── README.md
```

## Running it

Open `index.html` directly, or host the whole folder (e.g. GitHub Pages).

**Three features need a real web server (not `file://`) to work:** Google
Sign-In, Google Calendar sync, and PWA install ("Add to Home Screen"). A local
dev server (`python3 -m http.server`) is enough for testing; GitHub Pages
works for the real thing.

## Setting up Google Sign-In & Calendar sync

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs &
   Services → Credentials → **Create Credentials → OAuth Client ID → Web
   application**.
2. Add your hosted domain as an **Authorized JavaScript origin** (e.g.
   `https://yourusername.github.io` — no trailing slash, no path).
3. Open `js/app.js`, search for `GOOGLE_CLIENT_ID`, replace the placeholder
   with your real Client ID.
4. Push the update. Sign-in works from **Account**; Calendar sync (one-way,
   LifeXP → Google Calendar) is a separate toggle in **Settings → Calendar**.

## Setting up AI scoring (optional)

**Settings → AI** → paste a free [Gemini API key](https://aistudio.google.com/apikey),
hit **Test connection**. Without a key, a solid built-in local estimate is
used instead — never required.

## A note on the "sounds" folder

There isn't one, on purpose — every sound is synthesized live with the Web
Audio API (`js/app.js`, the `SOUND_DESIGN` object), not pre-recorded files.

## Data & privacy

Everything stays in this browser's local storage unless you connect an AI
key, a Shortcuts relay URL, Google Sign-In, or Calendar sync — all optional.
Use **Account → Data backup / Export data** to save a copy, and **Account →
Delete account** to wipe it clean.

## Updating the live site

Replacing files here doesn't update GitHub Pages automatically — re-upload
the changed files to your repo, and it rebuilds within a minute or two of the
commit.
