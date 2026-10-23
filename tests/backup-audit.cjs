'use strict';
const assert = require('node:assert/strict');
const { auditBackup, stateChecksum } = require('../scripts/backup-audit.cjs');
function fixture() {
  const state = {
    projects: Array.from({ length: 6 }, (_, i) => ({ id: `synthetic-p${i}`, name: 'SYNTHETIC', contract: 50000, retAmt: 2500 })),
    tx: [{ id: 'synthetic-t1', pid: 'synthetic-p0', type: 'out', amount: 30000 }],
    boq: [{ id: 'synthetic-b1', pid: 'synthetic-p0', qty: 1, unitPrice: 100 }],
    guarantees: [{ id: 'synthetic-g1', pid: 'synthetic-p0', amount: 2500 }],
    auditLog: [{ id: 'synthetic-a1', action: 'sample' }],
    dataRevision: 3
  };
  return { backupFormat: 2, exportedAt: '2026-10-22T15:07:02.546Z',
    sourceOrigin: 'https://example.test', dataRevision: 3, stateChecksum: stateChecksum(state), state };
}
function verify(item) { return auditBackup(JSON.stringify(item)); }
let count = 0;
const test = (name, fn) => { fn(); count++; console.log('PASS backup audit:', name); };
test('accept valid synthetic format-2 envelope and financial totals', () => {
  const report = verify(fixture());
  assert.equal(report.checksumMatches, true);
  assert.deepEqual(report.errors, []);
  assert.equal(report.counts.projects, 6);
  assert.equal(report.counts.tx, 1);
  assert.equal(report.totals.outgoingCents, 3000000);
  assert.equal(report.totals.contractsCents, 30000000);
});
test('reject modified state with preserved source checksum', () => {
  const item = fixture(); item.state.tx[0].amount = 31000;
  assert(verify(item).errors.some(x => x.code === 'STATE_CHECKSUM_MISMATCH'));
});
test('reject duplicate project IDs even after checksum refresh', () => {
  const item = fixture(); item.state.projects[2].id = 'synthetic-p1';
  item.stateChecksum = stateChecksum(item.state);
  assert(verify(item).errors.some(x => x.code === 'DUPLICATE_RECORD_ID'));
});
test('reject orphan transaction links', () => {
  const item = fixture(); item.state.tx[0].pid = 'missing';
  item.stateChecksum = stateChecksum(item.state);
  assert(verify(item).errors.some(x => x.code === 'ORPHAN_PROJECT_LINK'));
});
test('reject invalid amount, revision and JSON', () => {
  const item = fixture(); item.state.tx[0].amount = -1;
  item.dataRevision = 6; item.stateChecksum = stateChecksum(item.state);
  const codes = verify(item).errors.map(x => x.code);
  assert(codes.includes('INVALID_TX_AMOUNT'));
  assert(codes.includes('DATA_REVISION_MISMATCH'));
  assert(auditBackup('{').errors.some(x => x.code === 'INVALID_JSON'));
});
test('retention deviation is a review advisory, never an automatic correction', () => {
  const item = fixture(); item.state.projects[1].retAmt += 360;
  item.stateChecksum = stateChecksum(item.state);
  const report = verify(item);
  assert.equal(report.errors.length, 0);
  assert(report.advisories.some(x => x.code === 'RETENTION_DIFFERS_FROM_5_PERCENT' && x.deltaCents === 36000));
});
test('fail closed on missing collections and oversized input', () => {
  const item = fixture(); delete item.state.projects;
  item.stateChecksum = stateChecksum(item.state);
  assert(verify(item).errors.some(x => x.code === 'MISSING_COLLECTION'));
  assert(auditBackup('sample', { maxBytes: 3 }).errors.some(x => x.code === 'FILE_TOO_LARGE'));
});
console.log(`PASS backup audit: ${count} synthetic tests, no files/network/customer data written`);
