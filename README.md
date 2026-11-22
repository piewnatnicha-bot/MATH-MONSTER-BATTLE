# Math Monster Battle — เกม 3D บน GitHub Pages

เกมภาษาไทยแบบ Mobile First เล่นบน iPhone / Android / คอมพิวเตอร์ ไม่ต้องสมัครสมาชิก

## วิธีอัปโหลด GitHub Pages
1. เข้า https://github.com แล้วลงชื่อเข้าใช้
2. กด **New repository** ตั้งชื่อ `MATH-MONSTER-BATTLE` เลือก **Public** และกด Create repository
3. กด **Add file → Upload files** แล้วอัปโหลดไฟล์ `index.html`, `app.js`, `manifest.webmanifest`, `icon.svg` จาก ZIP (ไม่ต้องอัปโหลด ZIP โดยตรง)
4. กด **Commit changes**
5. ไปที่ **Settings → Pages → Build and deployment → Source: Deploy from a branch**
6. เลือก **Branch: main**, โฟลเดอร์ **/(root)** แล้วกด Save
7. รอสักครู่ จากนั้นเปิด `https://USERNAME.github.io/MATH-MONSTER-BATTLE/` โดยแทน USERNAME ด้วยชื่อบัญชี GitHub ของคุณ

## การเล่น
- กดเริ่ม เลือกความยาก แล้วตอบโจทย์คณิต 4 ตัวเลือก
- ตอบถูกโจมตีมอนสเตอร์และได้เหรียญ; ตอบผิดหรือหมดเวลาเสีย HP
- ใช้เหรียญ 20 เหรียญฟื้นพลัง 30 HP; ผ่าน 10 ด่านเพื่อชนะ
- คะแนนสูงสุดและเหรียญบันทึกเฉพาะเบราว์เซอร์ที่ใช้ (localStorage)
- ไม่มี Login และไม่มีการส่งคะแนนไปยังเซิร์ฟเวอร์

## เทคโนโลยี
HTML + CSS + JavaScript + Three.js (3D WebGL) ผ่าน CDN `cdn.jsdelivr.net` จึงต้องมีอินเทอร์เน็ตเพื่อโหลด Three.js และใช้เบราว์เซอร์ที่รองรับ WebGL

## หมายเหตุ
- หากเปิดไฟล์ `index.html` โดยตรงบน MacBook อาจติดข้อจำกัดของ ES modules; ให้เปิดผ่าน GitHub Pages หรือ local web server
- หากจอดำ ให้ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตและการรองรับ WebGL
- หากแก้ไฟล์แล้วไม่อัปเดต ลองเปิดหน้าต่างส่วนตัวหรือรีเฟรช
- การเพิ่มหน้า Home Screen: Safari iPhone → Share → Add to Home Screen; Chrome Android → เมนู → Add to Home screen
