# AREA Ledger — R2 attachment staging activation

v492 adds the private attachment vault API and D1 file index, but does **not** invent or commit an R2 bucket binding.

## Intended staging resource

- R2 bucket: `area-ledger-files-staging`
- Worker binding: `LEDGER_FILES`
- D1 metadata migration: `gateway/migrations/0002_ledger_files.sql`
- Existing file limit retained: 4 MiB per file

## Safe activation order

1. Create the staging R2 bucket in the AREA Ledger Cloudflare account.
2. Add `LEDGER_FILES` to **staging only**.
3. If D1 staging is active, apply `0002_ledger_files.sql`.
4. Deploy staging.
5. Check `/health`: `r2Files` must be `true`.
6. Test one small image through the authenticated file API.
7. Verify retrieval requires the same Cloud recovery key and a cross-ledger key cannot read the object.
8. Only after D1/R2 reconciliation passes should existing base64 attachments be migrated out of ledger state.

## Wrangler binding shape

Add only after the real bucket exists:

```toml
[[env.staging.r2_buckets]]
binding = "LEDGER_FILES"
bucket_name = "area-ledger-files-staging"
```

Do not make the bucket public. Do not commit Cloudflare API tokens.

## Security model

- Every file request requires the same `X-AREA-Ledger-Key` capability used by Cloud Ledger.
- The Worker hashes that capability and scopes every R2 object key to the resulting ledger hash.
- Only JPEG, PNG, WebP and PDF are accepted.
- SVG, HTML and arbitrary active content are rejected.
- Downloads use `Cache-Control: private, no-store` and `X-Content-Type-Options: nosniff`.
- Cross-ledger object access is rejected before the R2 read.
