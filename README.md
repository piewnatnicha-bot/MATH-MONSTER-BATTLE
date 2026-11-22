# Math Monster Quest — Animated Adventure

เกมผจญภัย 2D สไตล์การ์ตูนมีมิติ (ไม่ใช่ 3D WebGL) สำหรับมือถือและ GitHub Pages ตัวละครและมอนสเตอร์เคลื่อนไหวจริง เดินสำรวจ ต่อสู้ด้วยโจทย์คณิตศาสตร์ 3 พื้นที่ และทำเควสต่อเนื่อง

## ติดตั้ง GitHub Pages
1. แตก ZIP
2. สร้าง GitHub repository แบบ Public เช่น `MATH-MONSTER-QUEST`
3. Upload ไฟล์ `index.html`, `app.js`, `icon.svg`, `manifest.webmanifest` ลง root ของ repository (ไม่อัปโหลด ZIP เป็นไฟล์เดียว)
4. Settings > Pages > Build and deployment > Deploy from a branch > main > /(root) > Save
5. เปิด `https://USERNAME.github.io/MATH-MONSTER-QUEST/`

## การเล่น
- มือถือ: ปุ่มซ้าย ขวา และโจมตี
- คอมพิวเตอร์: A/D หรือ ลูกศร และ Space
- เดินเข้าหามอนสเตอร์ กดโจมตี แล้วเลือกคำตอบใน 16 วินาที
- ตอบถูกกำจัดศัตรู ได้เหรียญและเลเวล; ตอบผิดเสีย HP
- ทำเควสครบเพื่อปลดล็อกพื้นที่ต่อไป
- เก็บข้อมูลความคืบหน้าผ่าน localStorage ในเบราว์เซอร์เดียวกัน

## ข้อจำกัด
ไม่มีระบบสมาชิก ไม่ซิงก์ข้อมูลข้ามอุปกรณ์ ไม่ต้องใช้ Firebase และไม่ต้องโหลดไลบรารีภายนอก เกมเป็นภาพเคลื่อนไหว Canvas 2D แบบการ์ตูนมีมิติ เพื่อให้เล่นได้ลื่นบนมือถือ; ยังไม่ใช่โมเดล 3D เต็มรูปแบบ
