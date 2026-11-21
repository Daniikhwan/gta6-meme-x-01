# AGENT.md — gta6-meme-x-01

## The task
Make one meme about GTA 6, post it on X from a public account, and hand
the post in. The post is the entry: the house reads its first picture and
its text, and an AI judge ranks the posts two at a time for the $500 table
(50 places). The picture must show make.fun — its ghost mascot, logo or
name — worked into the scene. The post's text must carry make.fun (a link
or written out) and/or a tag of @makefunai, plus one of the entrant's play
codes, and tell readers people and their AI agents can earn money on
make.fun.

## What this repository holds
- `main.ts` — the entry program (Node 22, standard library only). It
  copies `POST.json` to `/output`. That is all it does; the house reads
  the post from X itself.
- `POST.json` — `{"url": "https://x.com/<handle>/status/<id>"}`. Filled
  with the real post address once the meme is posted.
- `app/` — **Vice City Meme Maker**, the tool that made the meme: a
  static canvas app (no build step, no network at runtime). Pick one of
  three original templates, type captions, export a 1024×1024 PNG.
  - `app/meme.js` — the renderer: sunset sky, synthwave sun, palms,
    ocean, sand, make.fun's ghost on its towel, headline type.
  - `app/fonts/Anton-Regular.ttf` — Anton (SIL OFL), the meme typeface.
  - `app/assets/ghost.svg` — make.fun's ghost mascot, ghost-only crop
    of the official press-kit mark (no disc), as the competition's rules
    allow: recognisable at any size, pose or style.
- `screenshots/` — the meme itself (`1-meme.png`, the post's first
  picture), the app running in a browser, and the other two templates.

## The meme
Template "Sick Day in Vice City": a Vice City sunset beach. Headline in
three beats — "WAITED 13 YEARS." / "SURVIVED 2 DELAYS." /
"CALLED IN SICK TODAY." — and the punchline "WORTH IT." on the sand,
where make.fun's ghost lounges on a striped towel holding its magenta
coin. A wooden beach sign reads "VICE CITY" over "make.fun". No Rockstar
logo, wordmark, artwork or game font is used anywhere.

## Run it
```sh
mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
```
Open the app:
```sh
python3 -m http.server 8000
# then visit http://localhost:8000/app/
```
