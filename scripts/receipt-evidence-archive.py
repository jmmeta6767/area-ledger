#!/usr/bin/env python3
"""Private, lossless AREA Ledger evidence backup. NO live ledger or browser writes.

Usage:
  python3 scripts/receipt-evidence-archive.py create source.json output.zip
  python3 scripts/receipt-evidence-archive.py verify output.zip
Never upload customer archive to source control or CI.
"""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import zipfile

MAX_BACKUP = 64 * 1024 * 1024
MAX_MEDIA = 12 * 1024 * 1024
MAX_ITEMS = 3000
MAX_TOTAL_MEDIA = 512 * 1024 * 1024
URI = re.compile(r'^data:(image/(?:jpeg|png|webp|gif)|application/pdf);base64,([a-zA-Z0-9+/=]+)$')
EXT = {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'application/pdf': 'pdf'}
SIGNATURE = {
    'image/jpeg': lambda b: b.startswith(b'\xff\xd8\xff'),
    'image/png': lambda b: b.startswith(b'\x89PNG\r\n\x1a\n'),
    'image/webp': lambda b: len(b) >= 12 and b.startswith(b'RIFF') and b[8:12] == b'WEBP',
    'image/gif': lambda b: b.startswith((b'GIF87a', b'GIF89a')),
    'application/pdf': lambda b: b.startswith(b'%PDF-'),
}

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def ledger_checksum(state):
    # The Ledger app computes FNV-1a over JavaScript JSON.stringify(state).charCodeAt(i).
    # UTF-16 code units are important for Thai and astral Unicode.
    compact = json.dumps(state, ensure_ascii=False, separators=(',', ':'))
    units = compact.encode('utf-16-le')
    h = 0x811c9dc5
    for i in range(0, len(units), 2):
        code = units[i] | (units[i + 1] << 8)
        h = ((h ^ code) * 0x01000193) & 0xffffffff
    return f'{h:08x}'

def unpack_source(raw):
    if len(raw) > MAX_BACKUP:
        raise ValueError('BACKUP_TOO_LARGE')
    try:
        doc = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        raise ValueError('INVALID_BACKUP_JSON') from None
    if not isinstance(doc, dict) or doc.get('backupFormat') != 2 or not isinstance(doc.get('state'), dict):
        raise ValueError('UNSUPPORTED_BACKUP')
    stored = doc.get('stateChecksum')
    if not isinstance(stored, str) or stored != ledger_checksum(doc['state']):
        raise ValueError('BACKUP_STATE_CHECKSUM_MISMATCH')
    return doc

def nodes(node, path=()):
    # Explicit iterative walk: avoids recursion depth attacks.
    stack = [(node, path)]
    while stack:
        value, here = stack.pop()
        if isinstance(value, dict):
            for key, child in value.items():
                stack.append((child, here + (key,)))
        elif isinstance(value, list):
            for i in range(len(value) - 1, -1, -1):
                stack.append((value[i], here + (i,)))
        elif isinstance(value, str) and value.startswith('data:'):
            yield here, value

def decode(uri):
    m = URI.fullmatch(uri)
    if not m:
        raise ValueError('UNSUPPORTED_OR_MALFORMED_EVIDENCE_URI')
    mime, encoded = m.groups()
    if len(encoded) > (MAX_MEDIA * 4 // 3 + 16):
        raise ValueError('MEDIA_TOO_LARGE')
    try:
        binary = base64.b64decode(encoded, validate=True)
    except (ValueError, base64.binascii.Error):
        raise ValueError('BAD_MEDIA_BASE64') from None
    if len(binary) > MAX_MEDIA:
        raise ValueError('MEDIA_TOO_LARGE')
    if not SIGNATURE[mime](binary):
        raise ValueError('MEDIA_SIGNATURE_MISMATCH')
    return mime, binary

def build(raw):
    doc = unpack_source(raw)
    media = {}
    rows = []
    total = 0
    for path, uri in nodes(doc['state']):
        if len(rows) >= MAX_ITEMS:
            raise ValueError('TOO_MANY_MEDIA_ITEMS')
        mime, content = decode(uri)
        total += len(content)
        if total > MAX_TOTAL_MEDIA:
            raise ValueError('MEDIA_TOTAL_TOO_LARGE')
        digest = sha256(content)
        name = 'evidence/' + digest + '.' + EXT[mime]
        # Identical bytes may be deduplicated, but preserve each referencing path.
        if name in media and media[name] != content:
            raise ValueError('EVIDENCE_HASH_COLLISION')
        media[name] = content
        rows.append({'path': list(path), 'name': name, 'mime': mime, 'sha256': digest, 'bytes': len(content)})
    manifest = {
        'format': 'area-ledger-receipt-evidence-1',
        'sourceSha256': sha256(raw),
        'sourceBytes': len(raw),
        'evidenceReferences': len(rows),
        'distinctEvidence': len(media),
        'files': rows
    }
    return manifest, media

def create(source, destination):
    source = Path(source)
    destination = Path(destination)
    raw = source.read_bytes()
    manifest, media = build(raw)
    if destination.exists():
        raise ValueError('ARCHIVE_ALREADY_EXISTS')
    # Do not produce a partial destination upon failure.
    destination.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.ledger-evidence-', suffix='.tmp', dir=destination.parent)
    try:
        with os.fdopen(fd, 'wb') as out:
            with zipfile.ZipFile(out, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=7, allowZip64=False) as z:
                z.writestr('backup/original.json', raw)
                for name, content in sorted(media.items()):
                    z.writestr(name, content)
                z.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, separators=(',', ':')).encode('utf-8'))
        verify(tmp)
        os.replace(tmp, destination)
    finally:
        if os.path.exists(tmp):
            os.unlink(tmp)
    return {'result': 'CREATED_AND_VERIFIED', 'source_sha256': manifest['sourceSha256'],
            'evidence_references': manifest['evidenceReferences'], 'distinct_evidence': manifest['distinctEvidence']}

def verify(archive):
    with zipfile.ZipFile(archive, 'r', allowZip64=False) as z:
        infos = z.infolist()
        members = [v.filename for v in infos]
        if len(members) > MAX_ITEMS + 2 or len(members) != len(set(members)):
            raise ValueError('ZIP_UNEXPECTED_FILES')
        if 'backup/original.json' not in members or 'manifest.json' not in members:
            raise ValueError('ZIP_MISSING_REQUIRED_FILES')
        media_bytes = 0
        for info in infos:
            if info.filename.startswith('evidence/'):
                if info.file_size > MAX_MEDIA:
                    raise ValueError('MEDIA_TOO_LARGE')
                media_bytes += info.file_size
                if media_bytes > MAX_TOTAL_MEDIA:
                    raise ValueError('MEDIA_TOTAL_TOO_LARGE')
            elif info.filename == 'backup/original.json':
                if info.file_size > MAX_BACKUP:
                    raise ValueError('BACKUP_TOO_LARGE')
            elif info.filename == 'manifest.json':
                if info.file_size > 4 * 1024 * 1024:
                    raise ValueError('MANIFEST_TOO_LARGE')
            else:
                raise ValueError('ZIP_UNEXPECTED_FILES')
        if z.testzip() is not None:
            raise ValueError('ZIP_CRC_MISMATCH')
        raw = z.read('backup/original.json')
        expected, media = build(raw)
        manifest = json.loads(z.read('manifest.json'))
        if manifest != expected:
            raise ValueError('MANIFEST_MISMATCH')
        if set(members) != {'backup/original.json', 'manifest.json', *media.keys()}:
            raise ValueError('ZIP_UNEXPECTED_FILES')
        for name, content in media.items():
            if z.getinfo(name).file_size != len(content) or z.read(name) != content:
                raise ValueError('EVIDENCE_CONTENT_MISMATCH')
    return {'result': 'VERIFIED', 'source_sha256': expected['sourceSha256'],
            'evidence_references': expected['evidenceReferences'], 'distinct_evidence': expected['distinctEvidence']}

def cli(argv):
    if len(argv) == 3 and argv[0] == 'create':
        return create(argv[1], argv[2])
    if len(argv) == 2 and argv[0] == 'verify':
        return verify(argv[1])
    raise ValueError('USAGE: create BACKUP.json ARCHIVE.zip | verify ARCHIVE.zip')

if __name__ == '__main__':
    try:
        print(json.dumps(cli(sys.argv[1:]), sort_keys=True))
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        # No source paths, image contents, customer names or file IDs.
        print('ERROR:', str(exc) if isinstance(exc, ValueError) else 'ARCHIVE_IO_OR_FORMAT_ERROR', file=sys.stderr)
        sys.exit(1)