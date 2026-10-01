# AREA Ledger — D1 staging activation

v491 adds the D1 schema and migration/readback API, but does **not** invent or commit a Cloudflare database ID.

## Intended staging resources

- D1 database: `area-ledger-staging`
- Worker binding: `LEDGER_DB`
- Migration directory: `gateway/migrations`
- First migration: `0001_cloud_ledger.sql`

## Safe activation order

1. Create the real staging D1 database in the AREA Ledger Cloudflare account.
2. Add the real D1 binding to the **staging** environment only.
3. Apply `gateway/migrations/0001_cloud_ledger.sql`.
4. Deploy staging.
5. Check `/health`: `d1Ledger` must be `true`.
6. From the app's existing Cloud Sync ledger, run the guarded D1 migration endpoint.
7. Read back through `/v1/ledger/d1-read` and verify revision, entity count and semantic checksum.
8. Keep Durable Object as the active source until D1 readback matches and attachment payloads have been externalized to R2.

## Wrangler binding shape

Add this only after the real database exists:

```toml
[[env.staging.d1_databases]]
binding = "LEDGER_DB"
database_name = "area-ledger-staging"
database_id = "<REAL_CLOUDFLARE_D1_DATABASE_ID>"
migrations_dir = "migrations"
```

Do not copy a production database ID into staging. Do not commit API tokens or account secrets.

## Data model

- `ledger_meta`: one row per capability-key-derived ledger hash.
- `ledger_entities`: normalized rows for projects, transactions, BOQ, guarantees, contract controls, accounting controls and business documents.
- Entity JSON remains lossless during the shadow phase.
- Attachments/base64 photos are not a D1 target; they move to R2 before D1 becomes primary.

## Guard rails

- D1 migration is explicit; no browser fallback dataset is promoted automatically.
- D1 shadow migration refuses excessive batch counts instead of silently truncating data.
- D1 readback calculates a semantic SHA-256 checksum before declaring a mirror valid.
- Durable Object remains the recoverable source while D1 is in shadow mode.
