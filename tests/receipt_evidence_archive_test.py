import base64
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
import unittest
import zipfile

MODULE = Path(__file__).resolve().parent.parent / 'scripts/receipt-evidence-archive.py'
spec = importlib.util.spec_from_file_location('receipt_archive', MODULE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

def uri(data):
    return 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')
PNG = b'\x89PNG\r\n\x1a\n' + b'SYNTHETIC-ONLY'

def sample(photos=None):
    rows = [{'id':'secret-person','photo':uri(p)} for p in (photos or [])]
    state = {'projects':[], 'tx':rows}
    return json.dumps({'backupFormat':2,'state':state,'stateChecksum':m.ledger_checksum(state)}, ensure_ascii=False).encode()

class EvidenceTests(unittest.TestCase):
    def test_two_receipts_lossless(self):
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'backup.json'; dest=Path(tmp)/'out.zip'
            original=sample([PNG, PNG+b'2']);src.write_bytes(original)
            x=m.create(src,dest);self.assertEqual(x['evidence_references'],2)
            self.assertEqual(m.verify(dest)['result'],'VERIFIED')
            with zipfile.ZipFile(dest) as z:
                self.assertEqual(z.read('backup/original.json'),original)
                self.assertNotIn('secret-person',z.namelist())
    def test_dedup_preserves_two_refs(self):
        manifest, media=m.build(sample([PNG,PNG]))
        self.assertEqual(manifest['evidenceReferences'],2)
        self.assertEqual(manifest['distinctEvidence'],1)
        self.assertEqual(len(media),1)
    def test_no_evidence_is_valid(self):
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'backup.json';dest=Path(tmp)/'out.zip';src.write_bytes(sample())
            self.assertEqual(m.create(src,dest)['evidence_references'],0)
            self.assertEqual(m.verify(dest)['distinct_evidence'],0)
    def test_bad_base64_rejected(self):
        state={'tx':[{'photo':'data:image/png;base64,!!!!!'}]}
        raw=json.dumps({'backupFormat':2,'state':state,'stateChecksum':m.ledger_checksum(state)}).encode()
        with self.assertRaises(ValueError):m.build(raw)
    def test_mime_mismatch_rejected(self):
        state={'tx':[{'photo':uri(b'not a png')}]}
        raw=json.dumps({'backupFormat':2,'state':state,'stateChecksum':m.ledger_checksum(state)}).encode()
        with self.assertRaises(ValueError):m.build(raw)
    def test_tampered_backup_checksum_rejected(self):
        raw=sample([PNG]).replace(b'\"secret-person\"', b'\"changed-name!\"')
        with self.assertRaisesRegex(ValueError, 'CHECKSUM'):
            m.build(raw)
    def test_existing_archive_never_replaced(self):
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'backup.json';dst=Path(tmp)/'out.zip';src.write_bytes(sample())
            dst.write_bytes(b'EXISTING-DATA')
            with self.assertRaises(ValueError):m.create(src,dst)
            self.assertEqual(dst.read_bytes(),b'EXISTING-DATA')
    def test_modified_manifest_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'backup.json';dst=Path(tmp)/'out.zip';bad=Path(tmp)/'bad.zip';src.write_bytes(sample([PNG]));m.create(src,dst)
            with zipfile.ZipFile(dst) as z,zipfile.ZipFile(bad,'w') as zz:
                for name in z.namelist():
                    content=z.read(name)
                    if name=='manifest.json':
                        obj=json.loads(content);obj['evidenceReferences']=10;content=json.dumps(obj).encode()
                    zz.writestr(name,content)
            with self.assertRaises(ValueError):m.verify(bad)
    def test_modified_image_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'backup.json';dst=Path(tmp)/'out.zip';bad=Path(tmp)/'bad.zip';src.write_bytes(sample([PNG]));m.create(src,dst)
            with zipfile.ZipFile(dst) as z,zipfile.ZipFile(bad,'w') as zz:
                for name in z.namelist():
                    content=z.read(name)
                    if name.startswith('evidence/'):
                        content+=b'WRONG'
                    zz.writestr(name,content)
            with self.assertRaises(ValueError):m.verify(bad)
    def test_unsupported_format_no_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            src=Path(tmp)/'backup.json';dst=Path(tmp)/'out.zip';src.write_bytes(b'{"backupFormat":1,"state":{}}')
            with self.assertRaises(ValueError):m.create(src,dst)
            self.assertFalse(dst.exists())

if __name__=='__main__': unittest.main(verbosity=2)