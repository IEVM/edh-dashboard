# EDH-Dashboard

[![CI](https://github.com/IEVM/edh-dashboard/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/IEVM/edh-dashboard/actions/workflows/ci-cd.yml)

Ein Dashboard, mit dem du deine **Magic: The Gathering – Commander (EDH)** Partien tracken kannst.  
Die Daten werden in **Postgres** gespeichert (Vercel Marketplace) – ohne dass du selbst eine Datenbank hosten musst.

> Status: **Prototype / in Arbeit**

Live App: [edh-dashboard.vercel.app](https://edh-dashboard.vercel.app)

---

## Features

- **Google Login (OAuth2)**: Anmelden mit deinem Google Account
- **Postgres als Datenbank** (Vercel Marketplace)
- **In-App Verwaltung**: Decks anlegen, Spiele loggen, Statistiken analysieren
- **Deck-Thumbnails via Archidekt**  
  Wenn bei den Decks ein **Archidekt-Link** hinterlegt ist, bekommt jedes Deck ein kleines Thumbnail.

---

## Tech Stack

- **SvelteKit** (Fullstack / App-Routing)
- **Tailwind CSS**
- **Skeleton UI**
- **Google OAuth2**
- **Postgres** (Vercel Marketplace)
- **Vercel** (Deployment)
- **Upstash Redis** (Session und Token Store)
- **Vitest** (Unit Tests)
- **Playwright** (E2E Tests)
- **ESLint + Prettier** (Linting und Formatierung)

---

## Architektur (kurz)

Standard **SvelteKit** Projektstruktur.  
Das Projekt besteht aus:

- UI (Svelte + Skeleton + Tailwind)
- Server-seitiger OAuth2-Flow
- Postgres Integration (lesend/schreibend via DataManager)

---

## Voraussetzungen

- **Node.js / npm** (aktuelles LTS empfohlen)
- Ein **Google Cloud Projekt** mit OAuth2 Credentials
- **Vercel Postgres** (oder lokales Postgres)

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

2. Trage deine Google OAuth Werte ein (genaue Variablennamen siehe `.env.example`), typischerweise:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` / `GOOGLE_REDIRECT_URI`
- `POSTGRES_URL`
- `DATA_BACKEND` (sollte `db` sein)

### Google OAuth2 (High-Level)

- Erstelle in der **Google Cloud Console** OAuth2 Credentials (Web App)
- Setze die **Authorized redirect URI** passend zu deinem Callback (z.B. dev: `http://localhost:5173/...`)
- Trage Client ID / Secret / Callback in `.env` ein

---

### Postgres Schema

Lege die Tabellen in deiner Postgres-DB an (Vercel Postgres → SQL Console):

```sql
\i db/schema.sql
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

1. Mit Google Account anmelden
2. Decks im **Decks**-Bereich anlegen
3. Spiele im Deck-Detail hinzufügen
4. Auswertungen im Dashboard anschauen

---

## Limitations (aktuell)

- **Keine Self-Hosted Datenbank / Token-Persistenz**
  - Es werden keine Tokens in einer DB gespeichert
  - Nach einem **Server-Restart** ist daher **ein erneuter Login nötig**

---

## Roadmap (Ideen)

- Tests (z.B. Playwright/Vitest)
- Linting/Formatting (ESLint/Prettier)
- CI/CD (GitHub Actions)
- Polishing: UX rund um Sheet-Setup + Fehlerbehandlung

## CI/CD

Auf Pull Requests und auf Pushes nach main läuft CI mit npm ci, optionalem Format Check, optionalem Lint, optionalem Typecheck, Tests und Build.
Pull Requests deployen eine Vercel Preview und posten die Preview URL im PR.
Pushes nach main deployen in Vercel Production.

Umgebungsvariablen

- Google OAuth Secrets liegen in den Vercel Umgebungen Preview und Production
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

---

## License

**MIT License**

---

## Kontakt

- LinkedIn: https://www.linkedin.com/in/lukas-wipf
