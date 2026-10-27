# Infopedia

A static encyclopedia modelled on Grokipedia's interface: dark app-like shell, book-shelf
discovery, key-facts tables, left-hand contents rail, knowledge panel, inline citations and a
Ctrl+K search palette.

## Run it

Open `index.html` in a browser. No server, no build step, no dependencies, no tracking.
(For a local server: `python3 -m http.server` in this folder.)

## Deploy it

**GitHub Pages (recommended).** Push this folder to a repo as its root, then in
Settings -> Pages set Source = "GitHub Actions". The included workflow
(`.github/workflows/pages.yml`) publishes the site at
`https://<your-username>.github.io/<repo-name>/` on every push to `main`.
`.nojekyll` is present so Pages serves the files untouched.

```bash
git init -b main
git add -A
git commit -m "Infopedia: static encyclopedia site"
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

**Anywhere else.** Drag this folder onto app.netlify.com/drop, or push it to
Cloudflare Pages, Vercel, S3. `netlify.toml` is included; the publish directory
is the folder root.

## Contents

- `index.html` — home: search, featured books, most-read shelf, latest edits
- `page/*.html` — 16 articles
- `latest-edits.html`, `about.html`
- `assets/style.css`, `assets/app.js`, `assets/index-data.js` (search index)

Text is machine-drafted for this project and cites its sources inline. Not affiliated with xAI.
