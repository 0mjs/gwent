# Gwent Card Table (Deno + Vite + React)

Interactive, in-memory card table powered by `data/cards.json`.

## Run

```sh
deno task dev
```

## Build

```sh
deno task build
```

## Deploy (Vercel)

- Framework: Vite
- Install command: `yarn install --frozen-lockfile`
- Build command: `yarn build`
- Output directory: `dist`

`vercel.json` is already configured with these settings.

## Features

- Table rendering for every card in `data/cards.json`
- Search across key card fields
- Select filters for deck, expansion, territory, and type
- Checked-state filtering (all / checked / unchecked)
- Per-row checkboxes with bulk check/uncheck on visible rows
- Client-side sorting by name, deck, expansion, territory, and type
