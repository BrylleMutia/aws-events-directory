# AWS Events Directory

A searchable, static directory of AWS CloudTrail events for the core building blocks of an AWS architecture. Currently covers **IAM, STS, EC2, VPC, and RDS** — 1,130 events scraped from the public AWS API Reference.

- **Stack:** Vite · React · TypeScript · Tailwind CSS v4
- **Data:** static JSON committed to the repo (no backend, no runtime fetching)
- **Design:** minimalist dev-docs style, pastel pink accents, mobile-first

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the built app locally |
| `npm run scrape` | Re-scrape AWS docs and regenerate `src/data/*.json` |
| `npm run smoke` | Headless-Edge smoke test against the built app (requires `npm run preview` running on port 4173) |
| `npm run lint` | Run oxlint |

## How the data is generated

AWS does not publish a per-service CloudTrail event table for these services — instead, the docs state that **all API actions are logged**, and point to the service's API Reference "Actions" page (`API_Operations.html`), which lists every action as a link like `[CreateUser](API_CreateUser.html)`. The scraper fetches those pages, extracts the action names + canonical docs URLs, tags VPC-related EC2 actions, derives sections and verbs, and writes:

- `src/data/events.json` — the events (name, service, section, verb, URL, service tags)
- `src/data/services.json` — service metadata consumed by the UI

The app imports these files at build time, so the UI renders whatever is in the JSON — adding a service requires **no frontend changes**.

## Adding a service to scrape

A service can be added by editing two files in `scripts/` and re-running the scraper. Most services only need `sources.json`; services with a natural resource-domain split (like EC2/VPC) should also get section rules.

### 1. Add a source entry — `scripts/sources.json`

```jsonc
{
  "id": "s3",
  "name": "S3",
  "fullName": "Amazon Simple Storage Service",
  "eventSourcePrefix": "s3.amazonaws.com",
  "docsUrl": "https://docs.aws.amazon.com/AmazonS3/latest/userguide/cloudtrail-logging.html",
  "operationsUrl": "https://docs.aws.amazon.com/AmazonS3/latest/APIReference/API_Operations.html",
  "pagePrefix": "https://docs.aws.amazon.com/AmazonS3/latest/APIReference/"
}
```

| Field | Purpose |
| --- | --- |
| `id` | Machine ID used in URLs and as the service tag. Keep it short (2–3 chars) — it's rendered as a badge and appears in the URL hash |
| `name` | Short display name (shown on the filter chip) |
| `fullName` | Full service name (shown on chip hover) |
| `eventSourcePrefix` | The `eventSource` value in CloudTrail logs (e.g. `s3.amazonaws.com`), used for reference |
| `docsUrl` | The service's "Logging … with AWS CloudTrail" page |
| `operationsUrl` | The API Reference Actions page to scrape |
| `pagePrefix` | Base URL used to build each event's `API_<Action>.html` link |
| `virtual` | Optional. `true` for services that log under another service's API (e.g. VPC logs under `ec2.amazonaws.com`). Virtual services need no `operationsUrl` — their events come from tagging another service's action list (see step 3) |

Requirements for the scraped page: it must be server-rendered HTML containing links of the form `<a href="./API_ActionName.html">ActionName</a>` — this matches every AWS API Reference "Actions" page. If a future service instead documents its events in a table (some services do), the parser in `scripts/fetch-events.mjs` (`parseActions`) will need a second extraction path for that shape.

### 2. Add section rules — `scripts/sections.json`

Sections group events under each service's group headers. Add an entry keyed by the service `id`, a list of `{ "section, patterns }` rules, **most specific first**:

```jsonc
"s3": [
  { "section": "Buckets", "patterns": ["Bucket", "ListObjects"] },
  { "section": "Access Points", "patterns": ["AccessPoint"] },
  { "section": "Other", "patterns": [] }   // catch-all, must be last
]
```

The first rule whose any `pattern` (substring match) hits the action name wins; an empty `patterns` array is the catch-all. Skip this file entirely if a single section is fine — the engine falls back to `Other`.

### 3. Optional: tag events as a virtual service (e.g. a new `vpc`-style service)

Virtual services are curated subsets of another service's actions. To create one:

1. Add the source entry with `"virtual": true` and `"operationsUrl"` pointing at the parent service's Actions page.
2. Create `scripts/<id>-actions.txt`, one action name per line (blank lines and `#` comments allowed). Only actions found in the scraped parent list will be tagged; anything else produces a startup warning so you can catch typos and AWS renames.
3. `npm run scrape` — the scraper validates the list against the scraped action set, prints warnings for missing names, and writes the count to `meta.counts` (the UI is fully driven by the generated JSON).

### 4. Re-scrape and verify

```sh
npm run scrape      # regenerates src/data/*.json; watch for WARNING lines
npm run build       # type-check + production build
npm run smoke       # 15 end-to-end checks (start `npm run preview` first)
```

Manual spot-checks worth doing after adding a service:

- Event URLs point at the right docs and resolve (the smoke test checks one)
- `meta.counts` shows a sensible number for the new service (e.g. IAM ≈ 176, EC2 ≈ 779)
- Sections and verb filters populate in the UI; the service chip appears with a live count

## Project structure

```
scripts/
  fetch-events.mjs      # scrape pipeline: fetch -> parse -> tag -> validate -> write
  sources.json          # per-service source config (the only required edit for new services)
  sections.json         # per-service section derivation rules
  vpc-actions.txt       # curated action list for the virtual VPC service
  smoke.mjs             # headless-Edge end-to-end test (uses the system Edge)
src/
  data/                 # generated static data (committed; do not hand-edit)
  lib/search.ts         # in-memory index + ranked search
  hooks/useEventDirectory.ts  # filter state, facets, grouping, URL-hash sync
  components/           # SearchBar, ServiceChips, FilterSelects, EventRow, …
  types.ts              # shared data types
```

## Notes

- The scrape date is recorded in `events.json` → `meta.generatedAt`; re-run `npm run scrape` whenever you want to refresh against the current docs.
- The VPC service is a curated subset of the EC2 API (AWS documents VPC as part of the EC2 API). Adding a new virtual service follows the same pattern as step 3 above.
- Data is plain JSON imported at build time, so this works on any static host (GitHub Pages, S3 + CloudFront, etc.).
