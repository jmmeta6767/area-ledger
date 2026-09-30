# AREA Ledger V1 — Master v153

ระบบบัญชีและควบคุมโครงการรับเหมาก่อสร้างแบบ standalone/PWA

## Data safety
- ใช้ localStorage key `site-ledger-v1`
- ใช้ IndexedDB `site-ledger-db`
- ห้ามล้างหรือเปลี่ยน storage key/database โดยไม่ทำ migration
- การแก้ไขต้องรักษาข้อมูลเดิมและ backward compatibility

## Financial core
- มูลค่างาน = มูลค่างานตามสัญญา
- ต้นทุน = รายจ่าย/ต้นทุนของโครงการ
- กำไรคาดการณ์ = มูลค่างานตามสัญญา − ต้นทุน
- กำไร/ขาดทุนสุทธิ = รายรับจริงสะสม − ต้นทุน
- มูลค่าสัญญาไม่ถือเป็นรายรับจริงจนกว่าจะมีการรับเงินจริง

## Current modules
- Dashboard / Project control
- รายรับ–รายจ่าย / ค้างรับ–ค้างจ่าย
- BOQ / ต้นทุน
- งานประกัน / เงินประกันผลงาน
- ใบเสนอราคา → ใบวางบิล → ใบเสร็จรับเงิน
- งานพัสดุ / เอกสารโครงการ
- รายงาน / Excel / PDF / CSV
- Mobile / Desktop view mode

## v153 hardening
- รองรับรับชำระใบวางบิลบางส่วนหลายครั้ง
- ออกใบเสร็จตามยอดที่รับจริงแต่ละครั้ง
- รายงานแยกยอดรับแล้วและยอดคงเหลือของใบวางบิล
- คืน `billingReconcile()` และ `safeRepairBilling()` แบบรองรับ partial payments
- ป้องกัน regression หน้า “สุขภาพข้อมูลบัญชี” / ปุ่มซ่อมความเชื่อมโยง
- รองรับ WHT rate จริงจากเอกสาร เช่น 1%, 2%, 3%, 5% โดยข้อมูล transaction เก่า fallback 3%
- ใบเสร็จ partial payment รับ WHT rate จากใบวางบิลอย่างถูกต้อง
- ตรวจข้อมูลภาษี/ผู้เสียภาษีก่อนออกใบเสร็จจากการรับเงิน
- static QA: data-act ใน UI มี handler ครบ
- service worker cache: `site-ledger-v153-partial-payment-hardening`

## Development rule
พัฒนาต่อจาก `main` ของ repo `jmmeta6767/area-ledger` เท่านั้นเป็น Master ปัจจุบัน ห้ามย้อน logic เก่า ห้ามสร้างระบบใหม่ทับ และต้องทำ startup/data safety + navigation/UX regression check ก่อนเพิ่ม feature ใหญ่
