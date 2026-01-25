# Simple Website Starter Template

A minimal HTML, CSS, and JavaScript template for building websites.

## Files Included

- `index.html` - Basic HTML structure
- `styles.css` - Simple CSS styling
- `script.js` - JavaScript functionality

## Getting Started

1. Clone this repository
2. Open `index.html` in your browser
3. Start customizing the content and styles

## Modify

- Edit the HTML content in `index.html`
- Customize colors and layout in `styles.css`
- Add interactivity in `script.js`

Happy coding!

## Deploy on Render

This project uses SQLite. For Render, attach a persistent disk and point the DB to it.

1) Push this repo to GitHub.
2) In Render: New → Web Service → connect the repo.
3) Build Command: `npm install`
4) Start Command: `node server/server.js`
5) Add a Disk:
   - Name: `data`
   - Mount Path: `/var/data`
   - Size: 1 GB
6) Set env var `DB_PATH` to `/var/data/site.db`.
7) Deploy.
