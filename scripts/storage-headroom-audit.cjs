'use strict';
// AREA Ledger: strictly read-only, offline aggregate storage-headroom audit.
// Reads a file and prints no client names, project IDs, OCR contents, images or document text.
const fs = require('node:fs');

const MAX_INPUT_BYTES = 64 * 1024 * 1024;
// Early warning only. This is NOT a browser quota or an iPhone acceptance threshold.
const REFERENCE_BYTES = 4 * 1024 * 1024;
const BUCKETS = new Set(['projects', 'tx', 'boq', 'guarantees', 'auditLog']);
const DATA_URL = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+)(?:;[^,]*)?;base64,([a-z0-9+/=\r\n]+)$/i;

function analyzeBackupStorage(input, options = {}) {
  const maxInputBytes = Number.isSafeInteger(options.maxInputBytes) && options.maxInputBytes > 0
    ? options.maxInputBytes : MAX_INPUT_BYTES;
  const errors = [];
  const warnings = [];
  const result = {
    analysis: 'read-only-estimate',
    referenceOnlyBytes: REFERENCE_BYTES,
    referenceIsNotActualBrowserQuota: true,
    estimatedStateUtf8Bytes: 0,
    estimatedStateUtf16Bytes: 0,
    estimatedMediaBase64Chars: 0,
    estimatedMediaDecodedBytes: 0,
    embeddedMediaItems: 0,
    mediaPercentOfStateUtf16: 0,
    byCollection: {}, errors, warnings
  };
  let bytes;
  try { bytes = Buffer.isBuffer(input) ? input : Buffer.from(input); }
  catch (_) { errors.push('INVALID_INPUT'); return result; }
  if (bytes.length > maxInputBytes) { errors.push('FILE_TOO_LARGE'); return result; }
  let root;
  try { root = JSON.parse(bytes.toString('utf8')); }
  catch (_) { errors.push('INVALID_JSON'); return result; }
  if (!root || typeof root !== 'object' || Array.isArray(root) ||
    !root.state || typeof root.state !== 'object' || Array.isArray(root.state)) {
    errors.push('MISSING_BACKUP_STATE'); return result;
  }
  if (root.backupFormat !== 2) { errors.push('UNSUPPORTED_BACKUP_FORMAT'); return result; }
  // This is an estimate of data string size, not what the browser writes in practice.
  const raw = JSON.stringify(root.state);
  result.estimatedStateUtf8Bytes = Buffer.byteLength(raw, 'utf8');
  result.estimatedStateUtf16Bytes = raw.length * 2;
  const buckets = Object.create(null);
  for (const [collection, value] of Object.entries(root.state)) {
    const group = BUCKETS.has(collection) ? collection : 'other';
    const stats = buckets[group] || (buckets[group] = { embeddedMediaItems: 0, estimatedMediaBase64Chars: 0, estimatedMediaDecodedBytes: 0 });
    const stack = [value];
    while (stack.length) {
      const node = stack.pop();
      if (typeof node === 'string') {
        const match = DATA_URL.exec(node);
        if (match) {
          const encoded = match[2].replace(/[\r\n]/g, '');
          const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
          stats.embeddedMediaItems++;
          stats.estimatedMediaBase64Chars += encoded.length;
          stats.estimatedMediaDecodedBytes += Math.max(0, Math.floor(encoded.length * 3 / 4) - padding);
        }
      } else if (node && typeof node === 'object') {
        // JSON.parse only constructs tree structures (no recursive aliases).
        if (Array.isArray(node)) for (const child of node) stack.push(child);
        else for (const child of Object.values(node)) stack.push(child);
      }
    }
  }
  // Report only fixed, non-identifying collection names. No custom keys in output.
  for (const key of ['projects', 'tx', 'boq', 'guarantees', 'auditLog', 'other']) {
    if (!buckets[key]) continue;
    result.byCollection[key] = buckets[key];
    result.embeddedMediaItems += buckets[key].embeddedMediaItems;
    result.estimatedMediaBase64Chars += buckets[key].estimatedMediaBase64Chars;
    result.estimatedMediaDecodedBytes += buckets[key].estimatedMediaDecodedBytes;
  }
  result.mediaPercentOfStateUtf16 = result.estimatedStateUtf16Bytes
    ? Math.round((result.estimatedMediaBase64Chars * 2) * 1000 / result.estimatedStateUtf16Bytes) / 10 : 0;
  if (result.estimatedStateUtf16Bytes >= REFERENCE_BYTES * 0.7)
    warnings.push('ESTIMATED_LARGE_LOCAL_STORAGE_STATE');
  if (result.mediaPercentOfStateUtf16 >= 40)
    warnings.push('EMBEDDED_MEDIA_DOMINATES_STATE');
  return result;
}

if (require.main === module) {
  const path = process.argv[2];
  if (!path) {
    console.error('Usage: node scripts/storage-headroom-audit.cjs /private/AREA-Ledger-backup.json');
    process.exitCode = 2;
  } else {
    try {
      const stat = fs.statSync(path);
      // Avoid reading pathological input into memory.
      if (stat.size > MAX_INPUT_BYTES) {
        console.log(JSON.stringify(analyzeBackupStorage(Buffer.alloc(0), {maxInputBytes:1}).errors));
        process.exitCode = 2;
      } else {
        const result = analyzeBackupStorage(fs.readFileSync(path));
        console.log(JSON.stringify(result, null, 2));
        if (result.errors.length) process.exitCode = 1;
      }
    } catch (err) {
      // Avoid leaking paths, filenames, record content or data through error messages.
      console.error('Read failed:', err.code || 'IO_ERROR');
      process.exitCode = 2;
    }
  }
}
module.exports = { analyzeBackupStorage };
