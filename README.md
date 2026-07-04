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
browser (double-click it, or drag it into a browser tab) and the app works —
task management, XP/skills, the Life Heatmap, Court, Rewards, sounds, themes,
all of it.

**Two features need a real web server (not `file://`) to work:**

- **Google Sign-In** — Google's identity library refuses to run from a local
  file. Serve the folder over `http://` or `https://` (even something as
  simple as `npx serve .` or Python's `python3 -m http.server` from inside
  this folder works for local testing).
- **PWA install / "Add to Home Screen"** — same restriction; browsers only
  offer this over a real HTTP(S) origin, not `file://`.

Everything else (tasks, AI scoring with your own Gemini key, sounds, themes,
Court, Rewards) works identically either way.

## Setting up Google Sign-In (optional)

Sign-in is fully wired up in code but ships with a placeholder Client ID, since
a real one has to be tied to your specific domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs &
   Services → Credentials → **Create Credentials → OAuth Client ID → Web
   application**.
2. Add the exact origin you'll host this on (e.g. `https://yourdomain.com`) as
   an **Authorized JavaScript origin**.
3. Open `js/app.js`, search for `GOOGLE_CLIENT_ID`, and replace the
   placeholder string with your real Client ID.
4. Serve the folder over HTTP(S) (see above) and sign-in will work.

Sign-in only stores your name, email, and photo locally for convenience — it
does not sync tasks or data anywhere.

## Setting up AI scoring (optional)

In-app: **Settings → AI**, or the Account page's relay/key section. Paste in a
free [Gemini API key](https://aistudio.google.com/apikey) and hit **Test
connection**. Without a key, a solid built-in local estimate is used instead —
the app never requires this to function.

## A note on the "sounds" folder

There isn't one, on purpose. Every sound in the app (task completion, XP,
level-up, fines, navigation) is synthesized live with the Web Audio API —
short oscillator tones and filtered noise bursts — rather than pre-recorded
audio files. That keeps the whole project dependency-free and avoids shipping
binary audio assets that would need separate licensing. The sound design
itself lives in `js/app.js`, in the `SOUND_DESIGN` object and the functions
around it (`playTone`, `playClink`, `playThud`).

## Data & privacy

All data stays in this browser's local storage unless you explicitly connect
something:
- An AI key (Gemini) sends task titles to Google's API for scoring.
- A Shortcuts relay URL (optional) lets you pull in externally-completed tasks.
- Google Sign-In (optional) only stores your profile info locally.

Nothing else leaves the device. Use **Account → Data backup / Export data** to
save a copy of everything, and **Account → Delete account** to wipe it clean.
