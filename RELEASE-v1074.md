# v1074 — Single transaction save reliability

Extend verified local recovery-copy archiving to single transaction saves. The primary ledger and receipt images remain intact; Cloud Sync is never enabled implicitly. Recovery retries once, blocks duplicate clicks and rejects draft or primary changes during the asynchronous archive.

Capture the displayed amount at the save boundary. A rejected single create/edit now restores the audit trail along with the ledger and last-used fields, and displays the specific storage failure persistently above the save controls. Share validated backup archiving with the batch save path, including protection against malformed backup copies.

Validation: 612 QA groups plus 12 expense batch and 10 single-save storage regressions; full production release QA. Existing storage keys and cross-tab conflict protection retained. Device-specific behavior still requires user confirmation on their iPhone; tests use isolated synthetic ledgers.
