# Karneval der Kulturen 2026 — Nationality Statistics

Interactive landing page for exploring inferred nationality and cultural signals from the Berlin Karneval der Kulturen 2026 public programme.

## Important methodology note

This project does **not** claim to measure legal nationality or passport demographics. The Karneval pages publish group, artist, programme and cultural descriptions. The dataset therefore infers **nationality / culture signals** from names, descriptions, music and dance styles, languages, food traditions, flags, organizations and explicit country references.

Each row includes:

- `pool`: `parade` or `street-fest`
- `name`: group / artist / listing label
- `country`: inferred country, culture, diaspora or region
- `region`: larger regional bucket
- `confidence`: 0–100 estimate
- `evidence`: why the inference was made

## Data sources

- Parade: https://karneval.berlin/umzug/
- Street fest: https://karneval.berlin/fest/

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

A GitHub Actions workflow in `.github/workflows/pages.yml` builds the Vite app and deploys it to GitHub Pages whenever `main` is updated.

In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

## Next data improvement

The starter dataset should be expanded by reading every group and programme description from the source pages and replacing broad regional placeholders with evidence-backed rows. Keep ambiguous identities as regional or diaspora entries instead of forcing a single country.
