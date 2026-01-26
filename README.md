# MyFashionSpace

A full-stack, Y2K-inspired social fashion network where users build profiles, connect with friends, and trade fashion items through a auction marketplace. The site blends MySpace nostalgia with a modern fashion-trading flow: users upload items to their personal Fashion closet, list them for sale with a floor price, and compete in a queue-based bidding system.

Deployed application: https://myfashionspace.onrender.com/ 

Notes: You might have to wait 50s for Render to launch the website. I would recommend using the site locally, if you don't want your data to disappear.

## Screenshots / Demo

[![Demo video](https://img.youtube.com/vi/3P6Smi5tTdI/0.jpg)](https://youtu.be/3P6Smi5tTdI)

Visit **MyFashionSpace** yourself and create an account for full on fashion-esque experience (since this screenrecord is muted).


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

Inspiration:

I love fashion, tech, and finance. So what's a better idea to bring my world to life through a website where people can trade and auction fashion designs, in a lot of GLITTERS and CUNTY MUSIC? This full-stack project is a mesh between a Social Media and My Own Adventure Spice.


Potential impact:

This has a huge impact on my life. Finally seeing my vision and passion is fulfilling. This is a vivacious idea, and I believe it can bring fashion girlies together and create a voluptuous community.


New technology learned and why:
- SQLite: chosen for a lightweight, file-based DB that is easy to run locally and deploy.

## Technical Rationale

Architecture rationale:
- The frontend is static HTML/CSS/JS served by Express for simplicity and full creative control over the Y2K aesthetic.
- The backend is grouped by feature area (auth, friends, trading) in a single routes file for easy iteration.

Key tradeoffs:
- SQLite vs. Postgres: SQLite is simple and portable but requires careful handling of persistence on Render.
- Single-server architecture keeps it approachable, but limits horizontal scaling.

Hardest bug and how I debugged it:
- The Add Friend logic: avoiding duplicates while supporting pending requests required careful queries. I debugged by logging each query, inspecting results, and ensuring only one row exists per user pair. The fix was to enforce a single row with a `status` field rather than storing both directions.

Challenges along the way:
- Shopping/Queue/Fashion/Sale flow: Situation: multiple pages needed to stay in sync with listings, bids, and ownership; Task: design a consistent data model; Action: split data into `items`, `sales`, and `bids` tables and enforced bid rules server-side; Result: the marketplace stays consistent and queue ordering is reliable.
- Background music across navigation: Situation: music would restart or desync during navigation; Task: keep playback continuous within page groups; Action: used a shared audio controller and stored playback state/mute in browser storage; Result: music remains consistent across back/forward navigation.
- Authentication with validation: Situation: login needed to match multiple fields with basic security; Task: validate email format and password length while keeping UX simple; Action: enforced checks on both client and server and blocked mismatches; Result: logins are reliable and bad input is rejected early.
- Cohesive UI across devices: Situation: the Y2K design broke on smaller screens; Task: preserve the aesthetic while staying responsive; Action: refit layouts with responsive sizing, scrollable panels, and consistent glow styles; Result: the theme remains intact on phones and desktops.

## AI Usage

Did you use AI tools?
- Yes (Codex and Copilot).

Example prompt and adaptation:
- Prompt: "Create a queue-based bidding system where users can only increase their own bid, and the queue sorts highest to lowest."
- Adaptation: I refactored the generated SQL into a single upsert-style flow in my routes, added explicit checks for floor price, and tied the response to the existing sale data model to avoid duplication.

---

Copyright (c) 2026 Minh Tai Nguyen. All rights reserved.
