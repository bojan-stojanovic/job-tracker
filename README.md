# Job Application Tracker

A pipeline board for job applications, with contacts, a timeline of interactions, analytics, and CSV import and export. Each user sees only their own data.

**Live demo:** https://<your-app>.vercel.app

## Features

- **Sign in with a magic link.** Passwordless sign-in through Supabase Auth. GitHub sign-in is planned but not enabled.
- **Pipeline board** with five columns: Applied, Interviewing, Offer, Rejected, and Withdrawn. Cards can be dragged with the mouse or keyboard, or moved with the "Move to" menu.
- **Optimistic moves with rollback.** A card moves immediately. If the save fails, it returns to its original column and an error explains why.
- **Application details** with contacts and a timeline of emails, calls, interviews, and notes.
- **Analytics** showing the funnel, response rate, and median days to first interview.
- **CSV export and import.** Import validates every row before saving anything, so a bad file imports nothing.
- **Light and dark themes.** The theme follows the system setting by default and can be changed manually.

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database and auth | Supabase (Postgres, Auth, Row Level Security) |
| ORM and migrations | Drizzle ORM, drizzle-kit |
| Validation | Zod 4, shared between forms, Server Actions, and CSV import |
| Drag and drop | dnd-kit |
| Charts | Recharts |
| Styling | Tailwind CSS 4 |
| Tests | Vitest |
| Package manager | Bun |

## Architecture

Pages are Server Components that load data inside `<Suspense>` boundaries, so the page shell renders immediately and the content streams in. Client Components are limited to interactive parts: the board, forms, the chart, and the theme toggle.

All writes go through Server Actions. Each action validates its input with the same Zod schema the form uses, gets the current user, and then runs the query. The server validates again even though the browser validates first, because anyone can call a Server Action directly.

Data access is behind a repository layer (`lib/repository/`). Pages and actions call the repository interfaces, not Drizzle directly. This keeps the UI independent of the storage details, and it's the layer that was swapped from an in-memory mock to Supabase.

### Data model

- `applications`: one row per application, with `status` and a `position` used for ordering within a column.
- `contacts` and `interactions`: belong to an application and are deleted with it.
- `application_status_events`: a history row written on every status change. Analytics read from this table, not from the current status, so the numbers reflect what actually happened.

Every table has a `user_id` column that references `auth.users`.

### Security

Security has two layers:

1. **Application code.** Every query and Server Action filters by the current user's ID. This is the primary ownership check.
2. **Row Level Security.** Policies in `supabase/rls.sql` allow each signed-in user to read and write only rows where `user_id` matches their own ID. The `with check` clause also stops a user from inserting rows owned by someone else.

The app connects to Postgres with Drizzle, which uses a role that bypasses RLS. That's why the application-level check is required, and RLS acts as a backstop if the public API is ever used to query these tables directly.

The middleware (`proxy.ts`) refreshes the session on each request and redirects signed-out visitors to `/login`. It uses `supabase.auth.getUser()`, which checks the token with Supabase, and not `getSession()`, which only reads the cookie.

### Design decisions

- **Server Actions instead of API routes for mutations.** The forms call the actions directly, with typed inputs and no separate endpoints to maintain. The CSV export is a Route Handler because it returns a file download.
- **Status events feed the analytics.** Time to interview is calculated from the event log, not estimated from the application date and interaction dates, so the number is accurate even after edits.
- **Status changes go through one action.** Editing an application doesn't change its status, so every status change is recorded in the event log and reflected on the board.
- **Gap-based positions.** Cards are ordered with positions spaced 1000 apart, so moving a card usually updates one row. A column is reindexed only when the gaps run out.
- **Moves are transactional.** Changing a status and writing its history event happen in the same transaction, so the two can't disagree.
- **Imports are all-or-nothing.** Every row is validated first. If any row fails, the import stops and reports the line numbers, and nothing is written.
- **Accessible drag and drop.** The keyboard sensor and the "Move to" menu work without a mouse. Screen readers announce save progress, and failed moves show a message.

## Getting started

### Prerequisites

- Bun (this project uses `packageManager: bun@1.4.3`)
- A Supabase project

### 1. Install

```bash
bun install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<pooler-host>:6543/postgres
```

- `NEXT_PUBLIC_*` values are safe to expose in the browser. Row Level Security limits what the publishable key can read.
- `DATABASE_URL` is the **transaction pooler** string (port 6543). Keep it on the server only. Never prefix it with `NEXT_PUBLIC_`.
- Don't commit `.env.local`. It's listed in `.gitignore`.

Find these values in the Supabase dashboard under **Project Settings → Data API** (URL), **API Keys** (publishable key), and **Database → Connection string** (pooler URI).

### 3. Set up the database

Create the tables from the Drizzle schema:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

Then run `supabase/rls.sql` once in the Supabase SQL Editor. It adds the foreign keys to `auth.users` and enables Row Level Security with the owner policies.

### 4. Configure authentication

In the Supabase dashboard:

- **Authentication → URL Configuration**: set Site URL to `http://localhost:3000`, and add `http://localhost:3000/**` to the redirect URLs.
- **Authentication → Providers → Email**: confirm it's enabled. Magic links are on by default.

### 5. Run it

```bash
bun run dev
```

Open `http://localhost:3000`, enter your email, and follow the sign-in link.

### Demo data (optional)

Sign in once so your account exists. In **Authentication → Users**, copy your account's UID, then run:

```bash
bun --env-file=.env.local scripts/seed-demo.ts <your-uid>
```

This adds eight applications with contacts, interactions, and status history. The script refuses to run if the user already has applications.

## Scripts

| Command | What it does |
|---|---|
| `bun run dev` | Start the development server |
| `bun run build` | Production build |
| `bun run start` | Serve the production build |
| `bun run test` | Run the unit tests once |
| `bun run test:watch` | Run the unit tests in watch mode |
| `bun run lint` | Lint the project |

Unit tests cover the analytics calculations (response rate, median, withdrawn handling), the CSV parser and serializer (quoting, line endings, formula-injection protection), and the Zod schemas (salary range, empty optional fields).

Note that `bun test` runs Bun's built-in runner, which doesn't pick up the Vitest tests. Use `bun run test`.

## Deployment

The app is deployed to Vercel, and the database is hosted on Supabase.

1. Push the repository to GitHub and import it into Vercel.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `DATABASE_URL` to the Vercel environment variables.
3. In Supabase, add `https://<your-app>.vercel.app/**` to the redirect URLs. Update the Site URL if sign-in links should point to production.

The demo runs on Supabase's free tier, which pauses inactive projects. A scheduled request keeps it available, and the demo account is reset periodically.

## Known limitations

- **Shared database.** Local development and the deployed app use the same Supabase project, so local testing writes to the demo data. A separate development project is the next step.
- **Email delivery.** Supabase's built-in email sender has a low hourly limit. Production sign-in needs a custom SMTP provider.
- **No end-to-end tests yet.** The planned Playwright tests would cover sign-in, creating and moving an application, and checking that one user can't read another user's data. The ownership rule is currently verified manually in the SQL Editor.
- **Status history is written by the app.** A database trigger would also catch changes made outside the app, such as direct SQL edits. This is a planned improvement.
- **Import limits.** Files are capped at 1 MB and 500 rows.

## Roadmap

- GitHub sign-in
- Playwright end-to-end tests
- Email reminders for follow-ups
- File attachments for applications
- Browser extension for capturing job postings

## License

MIT