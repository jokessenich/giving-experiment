# the giving experiment

A small Next.js + Neon site for tracking gift chains as they pass from one person to the next.

## what's here

- **homepage** (`/`) — recent activity, "what's moving," with a journey map for any chain
- **start a chain** (`/start`) — gated by a passphrase you set; creates a chain and gives you a printable card
- **log a stop** (`/c/[batch]/[number]`) — the URL printed on the card; anyone with the secret code can log where the package landed
- **api routes** under `/api/chains` and `/api/stops` for the forms

Photos and admin moderation are intentionally not built yet — the secret code on the card is the only gate. We can add a moderation queue later if we ever need it.

## first-time setup

### 1. install dependencies

```bash
npm install
```

### 2. create a Neon database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a project, name it `giving-experiment` (or whatever)
3. From the dashboard, grab the **pooled connection string** — it looks like `postgresql://user:pwd@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require`

### 3. set up your env file

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in:

- `DATABASE_URL` — the Neon connection string from above
- `ADMIN_TOKEN` — set this to anything random and memorable. You'll type it whenever you start a new chain. (You can use something like `gentle-river-47` style if you want.)

### 4. apply the schema

```bash
npm run db:setup
```

This creates the `chains`, `stops`, and `log_attempts` tables.

### 5. run it

```bash
npm run dev
```

Open http://localhost:3000.

## creating your first chain

1. Visit `/start`
2. Pick a mushroom batch (e.g. *morel*)
3. Fill in optional starter info (your name, city, what's inside the package)
4. Enter your `ADMIN_TOKEN` as the starter passphrase
5. Submit — you'll get back a card with a unique chain identifier and secret code
6. Print the page (or write the details out by hand on a real card) and tuck it into your package
7. Mail it / hand it / leave it on a bench

The recipient visits the URL on the card, types in the secret code, and logs where it landed. Their entry will appear on the homepage.

## deploying to Vercel

1. Push this to GitHub
2. In Vercel: New Project → import your repo
3. Add the env vars (`DATABASE_URL`, `ADMIN_TOKEN`) in Vercel's project settings
4. Deploy
5. Add `thegivingexperiment.com` as a custom domain

## notes on the design

- **fonts:** Fraunces (serif body + display), Caveat (handwritten accents — tagline, notes from people, step numbers), JetBrains Mono (small utility text)
- **palette:** warm paper, ink, muted sage, rust accent
- **handmade signals:** tape strips, slight rotations, dashed borders, a hand-drawn underline on "giving," a postage stamp in the footer, graph-paper map for journeys
- **language:** plainspoken with a quiet mycelium thread (chains have mushroom batch names; dormant chains are described as "going quiet")

## stack

- Next.js 14 (App Router)
- Neon (serverless Postgres) via `@neondatabase/serverless`
- Nominatim (OpenStreetMap) for geocoding — free, no API key
- TypeScript throughout
- No CSS framework — single `globals.css` that ports the prototype directly
