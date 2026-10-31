'use strict';
const assert = require('node:assert/strict');
const { analyzeBackupStorage } = require('../scripts/storage-headroom-audit.cjs');
const b = state => Buffer.from(JSON.stringify({ backupFormat: 2, state }), 'utf8');
const state = more => ({ projects: [], tx: [], boq: [], guarantees: [], auditLog: [], ...more });
let passed = 0;
function test(title, fn) { fn(); passed++; console.log('PASS', title); }
test('empty v2 backup is a valid read-only estimate', () => {
  const result = analyzeBackupStorage(b(state()));
  assert.equal(result.errors.length, 0);
  assert.equal(result.embeddedMediaItems, 0);
  assert.equal(result.referenceIsNotActualBrowserQuota, true);
});
test('base64 media counted without reading hidden metadata', () => {
  const receipt = 'data:image/jpeg;base64,' + Buffer.from('12345678').toString('base64');
  const result = analyzeBackupStorage(b(state({ tx: [{id: 'secret', photo: receipt}], auditLog: [] })));
  assert.equal(result.byCollection.tx.embeddedMediaItems, 1);
  assert.equal(result.byCollection.tx.estimatedMediaDecodedBytes, 8);
  assert(!JSON.stringify(result).includes('secret'));
  assert(!JSON.stringify(result).includes(receipt));
});
test('reports only fixed safe collection labels', () => {
  const result = analyzeBackupStorage(b(state({ 'PRIVATE_ACCOUNT_NUMBER': 'data:image/png;base64,QUJD' })));
  assert.equal(result.byCollection.other.embeddedMediaItems, 1);
  assert(!JSON.stringify(result).includes('PRIVATE_ACCOUNT_NUMBER'));
});
test('a large receipt triggers non-destructive advisory only', () => {
  const data = 'data:image/jpeg;base64,' + 'A'.repeat(3 * 1024 * 1024);
  const result = analyzeBackupStorage(b(state({ tx: [{photo: data}] })));
  assert.equal(result.errors.length, 0);
  assert(result.warnings.includes('EMBEDDED_MEDIA_DOMINATES_STATE'));
  assert(result.warnings.includes('ESTIMATED_LARGE_LOCAL_STORAGE_STATE'));
});
test('receipt storage placement is aggregate-only and never asserts remote readback', () => {
  const embedded = 'data:image/png;base64,QUJD';
  const result = analyzeBackupStorage(b(state({ tx: [
    { id: 'PRIVATE_EMBEDDED', photo: embedded },
    { id: 'PRIVATE_REMOTE', photoRef: 'r2/private-secret-key' },
    { id: 'PRIVATE_BOTH', photo: embedded, photoRef: 'r2/another-secret-key' },
    { id: 'PRIVATE_NONE' }, null
  ] })));
  assert.deepEqual(result.receiptPhotoPlacement, { embeddedOnly: 1, referenceOnly: 1, both: 1, neither: 1 });
  assert.equal(result.referencePresenceDoesNotVerifyCloudObject, true);
  assert.equal(result.embeddedMediaItems, 2);
  const output = JSON.stringify(result);
  for (const secret of ['PRIVATE_EMBEDDED', 'PRIVATE_REMOTE', 'PRIVATE_BOTH', 'r2/private-secret-key', 'r2/another-secret-key'])
    assert(!output.includes(secret));
});
test('unrecognized receipt photo values do not count as recoverable originals', () => {
  const result = analyzeBackupStorage(b(state({ tx: [{photo:'some-file.jpg',photoRef:'   '}] })));
  assert.equal(result.receiptPhotoPlacement.neither, 1);
  assert.equal(result.receiptPhotoPlacement.referenceOnly, 0);
});
test('storage estimate distinguishes unicode UTF-8/UTF-16', () => {
  const result = analyzeBackupStorage(b(state({ tx: [{sub: 'ค่าวัสดุ 🧱'}] })));
  assert.notEqual(result.estimatedStateUtf8Bytes, result.estimatedStateUtf16Bytes);
});
test('invalid envelope, invalid format and malformed content reject safely', () => {
  assert(analyzeBackupStorage('{bad').errors.includes('INVALID_JSON'));
  assert(analyzeBackupStorage('{}').errors.includes('MISSING_BACKUP_STATE'));
  assert(analyzeBackupStorage(JSON.stringify({ backupFormat: 1, state: state() })).errors.includes('UNSUPPORTED_BACKUP_FORMAT'));
});
test('oversized input rejected without echoing any source content', () => {
  const secret = 'TOP_SECRET_VALUE_DO_NOT_LOG';
  const result = analyzeBackupStorage(secret, { maxInputBytes: 3 });
  assert.deepEqual(result.errors, ['FILE_TOO_LARGE']);
  assert(!JSON.stringify(result).includes(secret));
});
test('report reads bytes only and never mutates input', () => {
  const input = b(state({tx:[{sub:'SECRET NAME',photo:'data:image/png;base64,QUJD'}]}));
  const before = Buffer.from(input);
  const report = analyzeBackupStorage(input);
  assert(input.equals(before));
  assert(!JSON.stringify(report).includes('SECRET NAME'));
});
console.log(`${passed} storage-headroom tests passed`);
