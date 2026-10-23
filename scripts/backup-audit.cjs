'use strict';
// Read-only, local audit of AREA Ledger backup format 2. No storage/network writes.
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');

function stateChecksum(state) {
  const serialized = JSON.stringify(state);
  let hash = 0x811c9dc5;
  for (let i = 0; i < serialized.length; i++) {
    hash = Math.imul(hash ^ serialized.charCodeAt(i), 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
function auditBackup(input, options = {}) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  const maxBytes = options.maxBytes || 64 * 1024 * 1024;
  const errors = [], advisories = [];
  const issue = (kind, code, details) => (kind === 'error' ? errors : advisories).push({ code, ...details });
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const report = { format: null, exportedAt: null, dataRevision: null, sourceOrigin: null, sha256,
    checksumStored: null, checksumComputed: null, checksumMatches: false,
    counts: { projects: 0, tx: 0, boq: 0, guarantees: 0, auditLog: 0 },
    totals: { contractsCents: 0, outgoingCents: 0, incomingCents: 0 }, errors, advisories };
  if (buffer.length > maxBytes) {
    issue('error', 'FILE_TOO_LARGE', { bytes: buffer.length, maxBytes });
    return report;
  }
  let envelope;
  try { envelope = JSON.parse(buffer.toString('utf8')); }
  catch (_) { issue('error', 'INVALID_JSON', {}); return report; }
  if (!envelope || Array.isArray(envelope) || typeof envelope !== 'object') {
    issue('error', 'INVALID_ENVELOPE', {}); return report;
  }
  report.format = envelope.backupFormat;
  report.exportedAt = envelope.exportedAt || null;
  report.dataRevision = envelope.dataRevision ?? null;
  report.sourceOrigin = envelope.sourceOrigin || null;
  report.checksumStored = envelope.stateChecksum || null;
  if (envelope.backupFormat !== 2) issue('error', 'UNSUPPORTED_BACKUP_FORMAT', {});
  if (!envelope.state || typeof envelope.state !== 'object' || Array.isArray(envelope.state)) {
    issue('error', 'MISSING_STATE', {});
    return report;
  }
  const state = envelope.state;
  report.checksumComputed = stateChecksum(state);
  report.checksumMatches = report.checksumStored === report.checksumComputed;
  if (!report.checksumMatches) issue('error', 'STATE_CHECKSUM_MISMATCH', {});
  if (!Number.isSafeInteger(envelope.dataRevision) || envelope.dataRevision < 0 ||
      envelope.dataRevision !== state.dataRevision) issue('error', 'DATA_REVISION_MISMATCH', {});
  if (!Number.isFinite(Date.parse(envelope.exportedAt)) || !/^https:\/\//.test(String(envelope.sourceOrigin || '')))
    issue('error', 'INVALID_EXPORT_METADATA', {});

  const required = ['projects', 'tx', 'boq', 'guarantees', 'auditLog'];
  for (const key of required) {
    if (!Array.isArray(state[key])) issue('error', 'MISSING_COLLECTION', { collection: key });
    else report.counts[key] = state[key].length;
  }
  if (required.some(key => !Array.isArray(state[key]))) return report;
  for (const key of required) {
    const seen = new Set();
    state[key].forEach((row, index) => {
      if (!row || typeof row !== 'object' || Array.isArray(row) || typeof row.id !== 'string' || !row.id.trim()) {
        issue('error', 'INVALID_RECORD_ID', { collection: key, index });
      } else if (seen.has(row.id)) issue('error', 'DUPLICATE_RECORD_ID', { collection: key, index });
      else seen.add(row.id);
    });
  }
  const pids = new Set(state.projects.filter(row => row && typeof row.id === 'string').map(row => row.id));
  function checkProjectLinks(rows, collection) {
    rows.forEach((row, index) => {
      if (row && typeof row.pid === 'string' && row.pid && !pids.has(row.pid))
        issue('error', 'ORPHAN_PROJECT_LINK', { collection, index });
    });
  }
  for (const key of ['tx', 'boq', 'guarantees']) checkProjectLinks(state[key], key);
  if (Array.isArray(state.quotes)) checkProjectLinks(state.quotes, 'quotes');
  state.projects.forEach((row, index) => {
    if (!row) return;
    const contract = Number(row.contract);
    if (!Number.isFinite(contract) || contract < 0 || typeof row.contract !== 'number') {
      issue('error', 'INVALID_CONTRACT_AMOUNT', { index }); return;
    }
    report.totals.contractsCents += Math.round(contract * 100);
    if (Number.isFinite(row.retAmt) && contract > 0) {
      const recorded = Math.round(row.retAmt * 100);
      const assumedFivePct = Math.round(contract * 5);
      if (Math.abs(recorded - assumedFivePct) > 1) {
        // Advisory only: a negotiated guarantee rate may differ from 5%.
        issue('advisory', 'RETENTION_DIFFERS_FROM_5_PERCENT', {
          index, deltaCents: recorded - assumedFivePct
        });
      }
    }
  });
  state.tx.forEach((row, index) => {
    if (!row) return;
    if (!['in', 'out'].includes(row.type)) issue('error', 'UNKNOWN_TX_TYPE', { index });
    if (typeof row.amount !== 'number' || !Number.isFinite(row.amount) || row.amount < 0) {
      issue('error', 'INVALID_TX_AMOUNT', { index }); return;
    }
    if (row.type === 'out') report.totals.outgoingCents += Math.round(row.amount * 100);
    if (row.type === 'in') report.totals.incomingCents += Math.round(row.amount * 100);
  });
  // Informational rather than data failure: unrecorded revenue is not necessarily lost revenue.
  if (state.tx.length > 0 && report.totals.incomingCents === 0)
    issue('advisory', 'NO_INCOMING_TRANSACTIONS_RECORDED', {});
  return report;
}
if (require.main === module) {
  const filename = process.argv[2];
  if (!filename) {
    console.error('Usage: node scripts/backup-audit.cjs /private/path/AREA-Ledger-backup.json');
    process.exitCode = 2;
  } else {
    try {
      const report = auditBackup(fs.readFileSync(path.resolve(filename)));
      // Never print project names, client details, OCR images or accounting descriptions.
      console.log(JSON.stringify(report, null, 2));
      if (report.errors.length) process.exitCode = 1;
    } catch (e) {
      console.error('Backup read failed:', e.code || e.name || 'unknown');
      process.exitCode = 2;
    }
  }
}
module.exports = { auditBackup, stateChecksum };
