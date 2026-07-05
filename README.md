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
│   └── app.js           All application logic
├── icons/
│   ├── icon-192.png      App icon (PWA / favicon)
│   ├── icon-512.png      App icon (PWA, larger)
│   └── icon-180.png      App icon (Apple touch icon size)
└── README.md
```

## Running it

Because everything is static, you can just open `index.html` directly in a
browser, or host the whole folder (e.g. GitHub Pages) — task management, XP,
skills, the Life Heatmap, Court, Rewards, sounds, themes, all of it works.

**Two features need a real web server (not `file://`) to work:**

- **Google Sign-In** — Google's identity library refuses to run from a local
  file. Needs `http://` or `https://`.
- **PWA install / "Add to Home Screen"** — same restriction.

## Setting up Google Sign-In (optional)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs &
   Services → Credentials → **Create Credentials → OAuth Client ID → Web
   application**.
2. Add your hosted domain as an **Authorized JavaScript origin**.
3. Open `js/app.js`, search for `GOOGLE_CLIENT_ID`, replace the placeholder
   with your real Client ID.
4. Push the update — sign-in will work.

## Setting up AI scoring (optional)

In-app: **Settings → AI**. Paste a free
[Gemini API key](https://aistudio.google.com/apikey), hit **Test connection**.
Without a key, a solid built-in local estimate is used instead.

## A note on the "sounds" folder

There isn't one, on purpose — every sound is synthesized live with the Web
Audio API (`js/app.js`, the `SOUND_DESIGN` object and `playTone`/`playClink`/
`playThud`), not pre-recorded files.

## Data & privacy

Everything stays in this browser's local storage unless you connect an AI key
(sends task titles to Google for scoring), a Shortcuts relay URL, or Google
Sign-In (stores your profile info locally only). Use **Account → Data
backup / Export data** to save a copy, and **Account → Delete account** to
wipe it clean.

## Updating the live site

If you're hosting this on GitHub Pages: replacing files here doesn't update
your live site automatically. Re-upload the changed files (or all of them) to
your GitHub repo — GitHub Pages rebuilds automatically within a minute or two
of a commit.
