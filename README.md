# EDH-Dashboard

Ein Dashboard, mit dem du deine **Magic: The Gathering – Commander (EDH)** Partien tracken kannst.  
Die Daten werden in **deinem eigenen Google Spreadsheet** gespeichert (als “Datenbank”) und von dort aus wieder ausgelesen – **ohne** dass du selbst eine Datenbank hosten musst.

> Status: **Prototype / in Arbeit**

---

## Features

- **Google Login (OAuth2)**: Anmelden mit deinem Google Account
- **Spreadsheet als Datenbank**: Wähle ein bestehendes Google Sheet als Datenquelle
- **Sheet-Generator**
  - Erzeuge ein **leeres Spreadsheet** im richtigen Format
  - Oder erzeuge ein **Test-Spreadsheet** mit ~**5000 zufällig generierten Testpartien** + meinen Commander Decks
- **Deck-Thumbnails via Archidekt**  
  Wenn bei den Decks im Spreadsheet ein **Archidekt-Link** hinterlegt ist, bekommt jedes Deck ein kleines Thumbnail.

---

## Tech Stack

- **SvelteKit** (Fullstack / App-Routing)
- **Tailwind CSS**
- **Skeleton UI**
- **Google OAuth2**
- **Google Sheets** (als Persistence-Layer)

---

## Architektur (kurz)

Standard **SvelteKit** Projektstruktur.  
Das Projekt besteht aus:

- UI (Svelte + Skeleton + Tailwind)
- Server-seitiger OAuth2-Flow
- Google Sheets Integration (Lesen/Schreiben ins ausgewählte Sheet)

---

## Voraussetzungen

- **Node.js / npm** (aktuelles LTS empfohlen)
- Ein **Google Cloud Projekt** mit OAuth2 Credentials
- Zugriff auf Google Sheets (dein Account)

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

### Google OAuth2 (High-Level)

- Erstelle in der **Google Cloud Console** OAuth2 Credentials (Web App)
- Setze die **Authorized redirect URI** passend zu deinem Callback (z.B. dev: `http://localhost:5173/...`)
- Trage Client ID / Secret / Callback in `.env` ein

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
2. Ein Spreadsheet auswählen, das als Datenbank dient
3. Alternativ: Ein **leeres Sheet im richtigen Format** erstellen lassen
4. Oder: Ein **Test-Sheet** generieren lassen (ca. 5000 Matches + Deckliste)
5. Partien tracken, Auswertungen im Dashboard anschauen

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

---

## License

**MIT License**

---

## Kontakt

- LinkedIn: https://www.linkedin.com/in/lukas-wipf
