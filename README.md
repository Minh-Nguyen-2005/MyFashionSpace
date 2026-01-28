# MyFashionSpace

Welcome to my online run-way show! A full-stack, Y2K social fashion network where fashionistas build profiles, connect with friends, and trade fashion items through a auction marketplace. The site took some inspo from **MySpace** with **my twist**, a modern fashion-trading flow: users upload items to their personal Fashion closet, list them for sale with a floor price, and compete in a queue-based bidding system.

**Deployed application**: https://myfashionspace.onrender.com/ 

Notes: You might have to wait ~50s for Render to launch the website. Since the demo website is active on Render Free, no data is recorded on there. Thus, I would recommend using the site locally, to interact with data already created by me in there.

## Demo Video

[![Demo video](https://img.youtube.com/vi/3P6Smi5tTdI/0.jpg)](https://youtu.be/3P6Smi5tTdI)

Visit **MyFashionSpace** yourself and create an account for full on fashion-esque experience with A LOT OF model friends to add and fashion pieces to buy, and that you can actually enjoy the music when using the website (since this screenrecord is muted).


## Setup (Local)

Prereqs:
- Node.js 22+

Steps:
1) Install dependencies:
   ```bash
   npm install
   ```
2) Start the server:
   ```bash
   node server/server.js
   ```
3) Visit:
   - Home: `http://localhost:3000/`

Notes:
- Local data is stored in `site.db` (SQLite).
- If you want to change the DB path, set `DB_PATH` in your environment.

## Usage

1) **Home**  
   Land on the Home page, then choose **Log in** or **Sign up**.

2) **Sign up / Log in**  
   Create a profile with your name, email, password, and profile image. Log in using the same details.

3) **Profile**  
   View your profile, edit your About/Interests blurbs, and see your current status.

4) **Friends**  
   - Click **Add Friend** to browse people and send requests.  
   - Review **Friend Requests** to accept or decline.  
   - Manage friends from **My Friends**.

5) **Fashion**  
   Your personal closet. Upload items, view them full-screen, or list them for sale with a floor price.

6) **Shopping**  
   Browse items listed by others. Click an item to open its **Queue** page and place a bid above the floor price.

7) **Queue**  
   See competing bids in real time. If you already bid, your new bid must be higher to replace your old one.

8) **Sale**  
   Track your active listings and accept a buyer’s bid to complete a trade.

9) **Yours Truly**  
   Author's signature page with themed visuals (ME).

10) **Music**  
   Music autoplays per page group. Use the icon to mute/unmute globally.

## Files

- `server/` - Backend
- `server/server.js` — Express app entry point.
- `server/routes.js` — API routes for auth, friends, and trading.
- `server/db.js` — SQLite initialization, migrations, and queries.

- `public/` — Frontend HTML/CSS/JS and assets.
- `public/styles.css` — Global styling and theme.
- `public/script.js` — Frontend behavior (music, UI interactions).
- `public/*.html` — Page templates (Home, Profile, Friends, Shopping, Fashion, Sale, Queue, etc.).
- `public/pictures/` — Images and decorative assets.
- `public/music/` — Audio files for background music.
- `public/uploads/` — Uploaded images.

- `site.db` — Local SQLite database file.
- `package.json` / `package-lock.json` — Dependencies and scripts.
- `render.yaml` — Render deployment configuration.
- `test/` — Local test pages and styling experiments.

## Frameworks and Tools

- Node.js + Express (web server)
- SQLite (data storage)
- Vanilla HTML/CSS/JS (frontend)

## Web Server and APIs

The server is an Express app serving static files from `public/` and JSON APIs for:
- Authentication (sign up, log in, log out)
- User profiles (view, update blurbs)
- Friends and friend requests (add, accept, decline, list)
- Fashion trading (upload items, list items for sale, bid queue, accept bid)

All APIs are implemented in `server/routes.js`, with DB queries in `server/db.js`.

## Frontend Design + Implementation

The UI is **my style**: a MySpace + Y2K + Barbie-inspired look with glitter, pink glow, and playful imagery. Pages use animated accents, sparkling text, and sticker-like decorations to feel handcrafted and nostalgic. Buttons, section headers, and hover states emphasize glow effects and soft gradients to match the chic, fashion-forward theme. The design is built directly in HTML/CSS with custom sections per page and themed backgrounds to keep the vibe consistent across the site.

## Backend Design + Implementation

The backend centers on two core systems: Friending and Fashion Trading.

**Friending system**:
- A friend request is stored as a row in `friends` with `status = pending`.
- Accepting a request flips `status` to `accepted`, making the connection bidirectional.
- Listing friends queries accepted relationships in both directions.
- Declining removes the pending row, allowing re-requests.

This avoids duplicate rows per direction while supporting a real request/accept flow. The logic ensures users cannot add themselves or send repeated requests.

**Fashion Trading system**:
- Users upload items to their personal Fashion list (name + image).
- When selling, an item is added to `sales` with a floor price and becomes visible on Shopping.
- Buyers place bids in a queue. The system enforces:
  - A bid must be above the floor price.
  - If a user already bid, their new bid must be higher than their previous bid.
  - A user has at most one active bid per sale; a higher bid replaces their older one.
- The queue is always displayed highest to lowest for clarity and fairness.
- The seller can accept a bid, transferring ownership: the item is removed from the seller's Fashion and Sale pages, removed from Shopping, and added to the buyer's Fashion list.

This structure mirrors real trading mechanics while keeping the database simple and fast for a small social network.

**Algorithms / data structures used**:
- Relational tables (`users`, `friends`, `items`, `sales`, `bids`) as the core data model.
- Friend request state machine using a `status` field (`pending` → `accepted`) to avoid duplicate edges.
- De‑duplication logic for friend requests (single row per user pair) using guarded inserts and checks.
- Priority ordering of bids using SQL `ORDER BY bid DESC` to show highest‑to‑lowest (queue behavior).
- Replacement update for bids (if a user already bid, only a higher bid replaces their previous row).
- Filtering and joins to compute relationships (friends vs. pending vs. incoming requests).

**Efficiency considerations**:
- Most reads are single-table queries or simple joins keyed by user or item IDs, which keeps lookup costs low for the expected scale.
- Bid queues are ordered in SQL so the server returns already-sorted results; the client only renders.
- Friend status checks avoid extra rows by using a single relationship record per pair, reducing storage and query work.
- SQLite is fast for small-to-medium datasets and the app favors denormalized display (few queries per page) to keep page loads responsive.

## Data Storage

SQLite is used for all persistent data:
- Users (profile info, image, email, password, online status)
- Friend relationships (pending + accepted)
- Fashion items
- Sales listings
- Bids

The DB file defaults to `site.db` locally, and can be configured with `DB_PATH`.

## Deployment on Render

This app runs as a Render Web Service.

Recommended (persistent storage):
1) Connect the GitHub repo.
2) Build Command: `npm install`
3) Start Command: `node server/server.js`
4) Add a persistent disk:
   - Name: `data`
   - Mount Path: `/var/data`
   - Size: 1 GB
5) Add env var:
   - `DB_PATH` = `/var/data/site.db`
6) Deploy.

Temporary option (no persistence):
- Set `DB_PATH` to `/tmp/site.db` (**data can be wiped on restart, since I use free version**).

## Learning Journey

**Inspiration**:

There's currently no active fashion/modeling clubs or spaces on Dartmouth campus. I love fashion, tech, and finance. So what's a better idea to bring my world to the Dartmouth community through a website where people can trade and auction fashion designs, in a lot of GLITTERS, CUNTY MUSIC, and 2000's nostalgia? This full-stack project is a mesh between a Social Media and My Own Adventure Spice.

**Potential impact**:

This has a huge impact on my life. Finally seeing my vision and passion is fulfilling. This is a vivacious idea, and I believe it can bring fashion girlies together and create a voluptuous community.

On Dartmouth’s campus, **MyFashionSpace** could create a playful, student-run marketplace for fashion and self‑expression. It can spark community around creativity, help students showcase personal style through customizing their own space, and even encourage sustainable reuse of clothing by making trading feel fun, social, and local. Imagine the (Free) Market on campus or Fizz's Marketplace but with FASHION and GLITTER !!

**New technology learned and why**:
- SQLite: chosen for a lightweight, file-based DB that is easy to run locally and deploy.
- Express sessions: learned how to keep users logged in across page navigation with server-side session state.
- Render deployment: learned how to deploy a Node + SQLite app and handle persistent storage configuration.
- Browser audio handling: learned how autoplay policies work and how to persist playback/mute state across navigation.

**Learning highlights (Frontend)**:
- Building an intuitive, responsive UI: I learned how to make a highly stylized, Y2K-heavy, personal interface still work across different screen sizes by adjusting layouts, adding scrollable panels, and tuning typography/glow effects with CSS.
- Dynamic UI + backend interaction: I implemented interactive flows like editing profile blurbs in place, accepting/declining friend requests, and live “Add Friend” lists that update based on server data.
- Interactivity beyond static HTML/CSS: I learned how to wire JS behaviors (music state — consistency when navigating forward/backward using outside interfaces like Chrome or Safari, animations (CSS and GIPHYs stored in `public/pictures`), LED lights, sparkling titles, hover glows, overlay modals) so the site feels alive rather than just a static page.
- Docs/tutorials referenced: I relied on official docs (MDN for audio/autoplay and DOM events, Express + SQLite docs for backend integration) to resolve edge cases like autoplay restrictions and session persistence.

**Learning highlights (Backend)**:
- API endpoints: I learned to design and wire up multiple endpoints for signup/login, friend requests, profile updates, and the marketplace flows (upload, sell, bid, accept).
- Data persistence: I learned how to structure a SQLite schema that supports relational features (users ↔ friends ↔ bids) and how to write queries that keep data consistent across multiple pages.
- Server-side logic: I implemented guardrails like bid validation, friend request de-duplication, and status transitions that only the server can enforce safely.
- External services: I linked Spotify and ANTM as external destinations from the UI. I did not yet implement a server‑side third‑party API (with keys) in this version, but I would like to add one (e.g., GIPHY search or Spotify metadata) as a future backend enhancement.

## Technical Rationale

**Architecture rationale**:
- The frontend is static HTML/CSS/JS served by Express for simplicity and full creative control over the Y2K aesthetic.
- The backend is grouped by feature area (auth, friends, trading) in a single routes file for easy iteration.

**Key tradeoffs**:
- SQLite vs. Postgres: SQLite is simple and portable but requires careful handling of persistence on Render.
- Single-server architecture keeps it approachable, but limits horizontal scaling.

**Hardest bug and how I debugged it**:
- The Add Friend logic: avoiding duplicates while supporting pending requests required careful queries. I debugged by logging each query, inspecting results, and ensuring only one row exists per user pair. The fix was to enforce a single row with a `status` field rather than storing both directions.

**Challenges along the way**:
- Shopping/Queue/Fashion/Sale flow: Situation: multiple pages needed to stay in sync with listings, bids, and ownership; Task: design a consistent data model; Action: split data into `items`, `sales`, and `bids` tables and enforced bid rules server-side; Result: the marketplace stays consistent and queue ordering is reliable.
- Background music across navigation: Situation: music would restart or desync during navigation; Task: keep playback continuous within page groups; Action: used a shared audio controller and stored playback state/mute in browser storage; Result: music remains consistent across back/forward navigation.
- Authentication with validation: Situation: login needed to match multiple fields with basic security; Task: validate email format and password length while keeping UX simple; Action: enforced checks on both client and server and blocked mismatches; Result: logins are reliable and bad input is rejected early.

Sign‑up bug fixes: Situation: duplicate emails or identical first+last combinations caused friend‑system confusion, and HEIC profile photos failed to render; Task: make sign‑ups unique and reject unsupported image formats; Action: added server‑side uniqueness checks for email and full name, plus an upload filter for JPG/PNG/GIF/WEBP; Result: duplicates are blocked, users see a clear failed state, and profile images consistently render.
- Cohesive UI across devices: Situation: the Y2K design broke on smaller screens; Task: preserve the aesthetic while staying responsive; Action: refit layouts with responsive sizing, scrollable panels, and consistent glow styles; Result: the theme remains intact on phones and desktops.

## AI Usage

Did you use AI tools?
- Yes (Codex and Copilot).

Example prompt and adaptation:
- Prompt: "Create a queue-based bidding system where users can only increase their own bid, and the queue sorts highest to lowest."
- Adaptation: I refactored the generated SQL into a single upsert-style flow in my routes, added explicit checks for floor price, and tied the response to the existing sale data model to avoid duplication.

## Future Plans

Incorporate and API-serve AI/ML vision model in classifying fashion (i.e., clothes, jewelry, heels, bags, etc.) vs. non-fashion (tomatoes, pans, toothpaste, books, phones, etc.) items uploaded to the space to detect and prevent trades that go against the website's theme and purpose.

---

Copyright (c) 2026 Minh Tai Nguyen. All rights reserved.
