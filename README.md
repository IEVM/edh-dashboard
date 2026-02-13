# EDH-Dashboard

[![CI](https://github.com/IEVM/edh-dashboard/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/IEVM/edh-dashboard/actions/workflows/ci-cd.yml)

Ein Dashboard, mit dem du deine **Magic: The Gathering – Commander (EDH)** Partien tracken kannst.  
Die Daten werden in **Supabase Postgres** gespeichert – ohne dass du selbst eine Datenbank hosten musst.

> Status: **Prototype / in Arbeit**

Live App: [edh-dashboard.vercel.app](https://edh-dashboard.vercel.app)

---

## Features

- **Supabase Auth (Google OAuth)**: Anmelden mit deinem Google Account
- **Postgres als Datenbank** (Supabase)
- **In-App Verwaltung**: Decks anlegen, Spiele loggen, Statistiken analysieren
- **Deck-Thumbnails via Archidekt**  
  Wenn bei den Decks ein **Archidekt-Link** hinterlegt ist, bekommt jedes Deck ein kleines Thumbnail.

---

## Tech Stack

- **SvelteKit** (Fullstack / App-Routing)
- **Tailwind CSS**
- **Skeleton UI**
- **Supabase Auth**
- **Postgres** (Supabase)
- **Vercel** (Deployment)
- **Upstash Redis** (Session Store)
- **Vitest** (Unit Tests)
- **Playwright** (E2E Tests)
- **ESLint + Prettier** (Linting und Formatierung)

---

## Architektur (kurz)

Standard **SvelteKit** Projektstruktur.  
Das Projekt besteht aus:

- UI (Svelte + Skeleton + Tailwind)
- Supabase Auth (OAuth via Supabase)
- Postgres Integration (lesend/schreibend via DataManager)

---

## Voraussetzungen

- **Node.js / npm** (aktuelles LTS empfohlen)
- Ein **Supabase Projekt** (Auth + Database)
- **Supabase Postgres** (oder lokales Postgres)

---

## Setup

```bash
npm install
```

### Environment konfigurieren

1. Kopiere die Example-Env:

```bash
cp .env.example .env
```

2. Trage deine Supabase Werte ein (genaue Variablennamen siehe `.env.example`), typischerweise:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL` (Prisma; Connection String)
- `POSTGRES_URL_NON_POOLING` (Prisma migrations)

### Supabase Auth (High-Level)

- Erstelle ein **Supabase Projekt**
- Aktiviere den Google Provider unter **Authentication → Providers**
- Trage `SUPABASE_URL` und `SUPABASE_ANON_KEY` in `.env` ein

---

### Prisma Migrations

Wir nutzen Prisma als Quelle der Wahrheit. Initialisiere die DB so:

```bash
npx prisma migrate dev
```

---

## Development starten

```bash
npm run dev
```

Danach im Browser öffnen (typisch SvelteKit dev URL):  
`http://localhost:5173`

---

## Nutzung

1. Anmelden (Google via Supabase)
2. Decks im **Decks**-Bereich anlegen
3. Spiele im Deck-Detail hinzufügen
4. Auswertungen im Dashboard anschauen

---

## Limitations (aktuell)

- **Auth-Sessions sind Cookie-basiert**
  - Wenn Cookies gelöscht werden, ist ein erneuter Login nötig

---

## Roadmap (Ideen)

- Tests (z.B. Playwright/Vitest)
- Linting/Formatting (ESLint/Prettier)
- CI/CD (GitHub Actions)
- Polishing: UX rund um Auth + Fehlerbehandlung

## CI/CD

Auf Pull Requests und auf Pushes nach main läuft CI mit npm ci, optionalem Format Check, optionalem Lint, optionalem Typecheck, Tests und Build.
Pull Requests deployen eine Vercel Preview und posten die Preview URL im PR.
Pushes nach main deployen in Vercel Production.

Umgebungsvariablen

- Supabase Keys liegen in den Vercel Umgebungen Preview und Production
- Upstash Redis Env Vars liegen in den Vercel Umgebungen Preview und Production
- Postgres Connection String liegt in den Vercel Umgebungen Preview und Production
- GitHub Environments enthalten nur die Vercel Deploy Credentials und nur nicht sensible Build Time Variablen falls nötig

Erforderliche GitHub Environment Secrets

- Preview Environment
- VERCEL_TOKEN für Vercel API Zugriff
- VERCEL_ORG_ID für die Vercel Organisation
- VERCEL_PROJECT_ID für das Vercel Projekt
- Production Environment
- VERCEL_TOKEN für Vercel API Zugriff
- VERCEL_ORG_ID für die Vercel Organisation
- VERCEL_PROJECT_ID für das Vercel Projekt

Upstash Redis Environment Variablen in Vercel

- UPSTASH_REDIS_REST_URL
- UPSTASH_REDIS_REST_TOKEN

Postgres Environment Variablen in Vercel

- POSTGRES_URL
- POSTGRES_PRISMA_URL
- POSTGRES_URL_NON_POOLING

Supabase Environment Variablen in Vercel

- SUPABASE_URL
- SUPABASE_ANON_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## License

**MIT License**

---

## Kontakt

- LinkedIn: https://www.linkedin.com/in/lukas-wipf
