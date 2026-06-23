-- Library barcode + scan support.

-- The barcode printed on a physical book (ISBN/EAN). Nullable so existing rows
-- and manually catalogued books without a barcode remain valid.
ALTER TABLE library_books ADD COLUMN isbn TEXT UNIQUE;

-- Idempotency ledger for offline-queued scans: a client generates an event_id
-- per scan and may re-send it after reconnecting; we record it once so a retry
-- can never create a duplicate loan/return.
CREATE TABLE scan_events (
  event_id   TEXT PRIMARY KEY,
  kind       TEXT NOT NULL,
  result_id  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
