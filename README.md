# 🏮 น้ำเต้าปูปลา: โรงเตี๊ยมเงาราตรี (Shadow Inn)

เกมคอนโซล TypeScript แนว Functional Programming ที่ยกระดับ "น้ำเต้าปูปลา" แบบดั้งเดิม
ให้กลายเป็นการผจญภัยในโรงเตี๊ยมเวทมนตร์ ที่ผู้เล่นต้องดวลดวงชะตากับ **เจ้ามือเงา** เพื่อไต่บันได
จิตวิญญาณ (เลเวล) ให้ถึงขีดสุด ก่อนที่เงินหรือหัวใจจะหมดลงเสียก่อน

---

## 1. แนวคิดธีมและความเป็นต้นฉบับ

แทนที่จะเป็นแค่ "เกมทายลูกเต๋า" ธรรมดา โปรเจกต์นี้สร้างโลกเรื่องราวรอบ ๆ กติกาน้ำเต้าปูปลา:

- ผู้เล่นคือนักเดินทางที่ก้าวเข้าสู่ **โรงเตี๊ยมเงาราตรี** ที่เปิดเฉพาะคืนจันทร์ดับ
- แทนคำว่า "เจ้ามือ" ใช้ **"เจ้ามือเงา"** ที่ไม่เคยแพ้ใครมาก่อน
- แทนคำว่า "stack/เลเวล" ใช้คอนเซปต์ **"ตราสัญลักษณ์ (Sigil)"** ที่จารึกได้ 3 สาย บนแท่นสลัก
- แทนคำว่า "ร้านค้า" ใช้ **"ตลาดเร้นลับ (Bazaar)"** ที่ขายอาหาร เศษตราสัญลักษณ์ และของวิเศษ
- แทนคำว่า "ภารกิจ" ใช้ **"พิธีกรรม/ป้ายประกาศ (Rites)"**
- ระบบ "ความหิว" กลายเป็น **"ความอิ่ม (Satiety)"** ที่ลดลงทุกดวล
- มีระบบ **"แรงก้องแห่งโชค" (Resonance)** เป็น streak multiplier
- มีของวิเศษ **แว่นขยายแห่งเงา** (ส่องเห็นลูกเต๋าล่วงหน้า) และ **เครื่องรางประกันภัย** (ลดการสูญเสีย)

จบเกมมี 2 แบบ: **เถ้าถ่านแห่งเงาราตรี (Ashes)** เมื่อหัวใจ/เงินหมด หรือ
**การไต่สู่จุดสูงสุด (Ascension)** เมื่อถึงเลเวล 30

---

## 2. สถาปัตยกรรม (Architecture) — ทำไมถึงไม่เหมือนงานทั่วไป

โปรเจกต์นี้ **ไม่ใช้โครงสร้าง `Game.ts` + `Player.ts` + `Shop.ts`** แบบที่ AI มักสร้าง
แต่ใช้แนวคิด **Event-Sourced Reducer แบบ Elm/Redux Architecture** ผสมกับการตั้งชื่อ
เชิงเรื่องราว (narrative naming) ที่ยังคงสื่อความหมายทางเทคนิคชัดเจน:

```
ผู้เล่นกดปุ่ม
     │
     ▼
MenuEntry (ui/screens.ts)  ──action──▶  Omen ("ลางบอกเหตุ" = Action/Event)
     │
     ▼
weaveFate(vessel, omen)  ["ผู้ทอชะตา" = Reducer, pure function]
     │
     ▼
FateResult { vessel: Vessel ใหม่ (immutable), echoes: string[] }
     │
     ├──▶ scribe.inscribeToChronicle(echoes)   [impure: เขียนไฟล์ log]
     └──▶ lantern.renderFrame(...)             [impure: พิมพ์จอใหม่]
```

หัวใจสำคัญ: **Vessel** (ก้อน state เดียวของทั้งเกม) เป็น immutable object ทุกครั้งที่มีการ
เปลี่ยนแปลง ฟังก์ชันจะคืน Vessel ก้อนใหม่เสมอ (`{ ...vessel, field: newValue }`) ไม่มีการ
`mutate` ค่าเดิมเลยตลอดทั้งโปรเจกต์

### ทำไมตั้งชื่อแบบนี้?
ชื่อไฟล์/ฟังก์ชันถูกออกแบบให้สื่อ **บทบาททางสถาปัตยกรรม** ผ่านคำในธีมเรื่องราว เพื่อไม่ให้
โครงสร้างซ้ำกับ template ทั่วไป แต่ยังคง comment กำกับบทบาทจริงไว้ทุกไฟล์ (pure/impure, ทำหน้าที่อะไร)

| ชื่อในโปรเจกต์ | บทบาทจริงทางสถาปัตยกรรม |
|---|---|
| `Vessel` | Game State (immutable) |
| `Omen` | Action / Event |
| `weaveFate` (fateWeaver.ts) | Reducer: `(state, action) => newState` |
| `oracle.ts` | Pure PRNG (Linear Congruential Generator, ไม่ใช้ `Math.random`) |
| `ordeal.ts` | แกนคำนวณผลแพ้/ชนะ (core game rule) |
| `resonance.ts` | Streak multiplier |
| `bazaar.ts` / `rites.ts` / `progression.ts` | Domain logic ของร้านค้า/ภารกิจ/เลเวล |
| `gaze.ts` | Selectors (derived state) |
| `braid.ts` | Custom `pipe`/`compose` utilities |
| `lantern.ts` / `input.ts` / `scribe.ts` | I/O Layer (impure): แสดงผล, รับคีย์บอร์ด, เขียน log |
| `screens.ts` | View layer (pure): แปลง Vessel → บรรทัดข้อความ + เมนู |

---

## 3. โครงสร้างไฟล์ทั้งหมด

```
proj/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── main.ts                  # จุดเริ่มโปรแกรม + I/O loop หลัก (impure orchestration)
    ├── types/
    │   └── mythos.ts            # type/interface ทั้งหมดของเกม (ไม่มี logic)
    ├── state/
    │   ├── genesis.ts           # pure factory: สร้าง Vessel เริ่มต้น
    │   ├── fateWeaver.ts         # reducer หลัก: weaveFate(vessel, omen) — pure
    │   └── gaze.ts               # pure selectors สำหรับคำนวณค่าที่ใช้แสดงผล
    ├── game/
    │   ├── oracle.ts             # pure RNG (LCG) — สุ่มลูกเต๋าทั้งหมด
    │   ├── ordeal.ts             # pure: คำนวณผลดวล (ตรง/ไม่ตรง, เงินได้-เสีย)
    │   ├── resonance.ts          # pure: streak multiplier
    │   ├── progression.ts        # pure: ระบบเลเวล/ความอิ่ม/หัวใจ
    │   ├── rites.ts              # pure: นิยามภารกิจ + ตรวจเงื่อนไข
    │   └── bazaar.ts             # pure: นิยามสินค้า + คำนวณผลซื้อ/อัปเกรด
    ├── ui/
    │   ├── screens.ts            # pure: ประกอบ Vessel → เนื้อหาจอ + เมนู
    │   ├── lantern.ts             # impure: พิมพ์/ล้างจอ
    │   └── input.ts               # impure: อ่านคีย์บอร์ด (ลูกศร/Enter/เลข/ปุ่มลัด)
    └── utils/
        ├── braid.ts               # pure: pipe/compose (`thread`, `weave`, `weaveAll`)
        ├── format.ts              # pure: สี ANSI, กรอบ, progress bar
        └── scribe.ts              # impure: เขียนไฟล์ log (`tavern-chronicle.log`)
```

---

## 4. วิธีติดตั้งและรัน

ต้องมี **Node.js เวอร์ชัน 18 ขึ้นไป** ติดตั้งไว้ในเครื่อง

```bash
# 1. เข้าไปในโฟลเดอร์โปรเจกต์
cd namtao-poo-pla-shadow-inn

# 2. ติดตั้ง dependency (มีแค่ typescript + ts-node + @types/node)
npm install

# 3. เล่นเกมทันทีแบบไม่ต้อง build (แนะนำ)
npm start

# หรือถ้าต้องการ build เป็น JavaScript ก่อนแล้วค่อยรัน
npm run build
npm run play
```

**สำคัญ:** ต้องรันในเทอร์มินัลจริง (ไม่ใช่ integrated terminal บางตัวที่ไม่รองรับ raw-mode)
เพื่อให้การกดลูกศรและปุ่มลัดทำงานได้ถูกต้อง

### วิธีเล่น
- ใช้ลูกศร **↑ / ↓** เพื่อเลื่อนไฮไลต์ แล้วกด **Enter** เพื่อยืนยัน
- หรือกดคีย์ลัดในวงเล็บ `[ ]` ได้โดยตรงทันที (ตัวเลขหรือตัวอักษร) โดยไม่ต้องไล่ไฮไลต์ก่อน
- เดินไปห้องวางเดิมพัน → เลือกสัญลักษณ์ → ใส่จำนวนเงินเดิมพัน → กด `f` เพื่อเผชิญหน้ากับเจ้ามือเงา
- บันทึกประวัติการเล่นทั้งหมดจะถูกเขียนลงไฟล์ `tavern-chronicle.log` ในโฟลเดอร์ที่รันโปรแกรม

---

## 5. กติกาเกมโดยสรุป

| ระบบ | รายละเอียด |
|---|---|
| **การดวล** | วางเดิมพันบนสัญลักษณ์ 1 ใน 6 (น้ำเต้า/ปู/ปลา/ไก่/กุ้ง/เสือ) แล้วทอยลูกเต๋า 3 ลูก ตรง 1/2/3 ลูก ได้เงิน 1/2/3 เท่าเดิมพัน ไม่ตรงเลยเสียเดิมพันทั้งหมด |
| **เลเวล (Ascend)** | สะสมแต้มจากการดวล/ภารกิจ ครบ 100 แต้ม/เลเวล ได้ 3 แต้มจารึกต่อเลเวล เลเวลสูงสุด 30 |
| **ตราสัญลักษณ์ (Sigil)** | ใช้แต้มจารึกเลือกอัปเกรด 3 สาย: เพิ่มรางวัล / กันขาดทุน / เร่งเลเวล — ทุบทิ้งได้ (คืนแต้มครึ่งหนึ่ง) |
| **เงิน** | เริ่มต้น 100 เหรียญ หมดเมื่อไหร่ = แพ้ทันที |
| **ความอิ่ม/หัวใจ** | ทุกดวลความอิ่มลดลง 12% ถ้าอิ่มหมด หัวใจหักไป 1 ดวง (เริ่มมี 3 ดวง) หัวใจหมด = ตาย |
| **แรงก้องแห่งโชค** | ชนะติดกันสูงสุด 5 ครั้ง ได้โบนัสเงินสูงสุด +50% |
| **ของวิเศษ** | แว่นขยาย (ดูเงาลูกเต๋าล่วงหน้า 1 ลูก) / ประกันภัย (ลดการสูญเสียลงครึ่งหนึ่งอัตโนมัติ) |
| **ภารกิจ** | สำเร็จเงื่อนไข (ชนะติดกัน/ชนะสะสม/เลเวล/ใช้จ่าย) แล้วไปรับรางวัลที่ป้ายประกาศ |

---

## 6. Functional Programming: สิ่งที่ implement จริง

### Pure functions (>70% ของฟังก์ชันทั้งหมด)
เกือบทุกฟังก์ชันใน `game/`, `state/`, `utils/braid.ts`, `utils/format.ts` เป็น pure function
100% — ไม่มี side effect, input เดิมให้ output เดิมเสมอ ตัวอย่างฟังก์ชัน pure ที่สำคัญที่สุด:

- **`weaveFate(vessel, omen)`** (`state/fateWeaver.ts`) — reducer หลักทั้งหมดของเกม
- **`judgeOrdeal(wager, dice, sigils, relics)`** (`game/ordeal.ts`) — ตัดสินผลแพ้ชนะ
- **`rollThreeDice(seed)` / `drawGlyph(seed)`** (`game/oracle.ts`) — สุ่มแบบ pure (LCG) รับ seed คืนทั้งค่าและ seed ถัดไป ไม่แตะ `Math.random()` เลย
- **`applyAscendPoints(level, progress, points)`** (`game/progression.ts`) — คำนวณเลเวลอัปแบบ recursive
- **`resonanceMultiplier(history)`** (`game/resonance.ts`) — คำนวณ streak multiplier

### Side effects ที่แยกออกมาอย่างชัดเจน (มีเพียง 3 จุดในทั้งโปรเจกต์)
1. **`ui/lantern.ts`** — การพิมพ์/ล้างจอ (`process.stdout.write`)
2. **`ui/input.ts`** — การอ่านคีย์บอร์ด (`readline`, `process.stdin`)
3. **`utils/scribe.ts`** — การเขียนไฟล์ log (`fs.appendFileSync`) และจุดเดียวที่แตะนาฬิกาเครื่อง (`Date.now()` ใน `game/oracle.ts:freshSeedFromClock` สำหรับสร้าง seed เริ่มต้นเท่านั้น)

`main.ts` เป็นเพียงจุด **orchestration** ที่เรียกใช้ pure core และ I/O layer มาประกอบกัน
ไม่มี game logic ใด ๆ อยู่ใน `main.ts` เลย

### Function composition (pipe/compose ที่เขียนเอง)
`utils/braid.ts` มี:
- `thread(value, f1, f2, ...)` — เทียบเท่า `pipe` (ไหลซ้ายไปขวา, มี overload พร้อม type-safety สูงสุด 5 ฟังก์ชัน)
- `weave(f2, f1)` — เทียบเท่า `compose` (ขวาไปซ้าย)
- `weaveAll(...fns)` — ประกอบฟังก์ชันชนิดเดียวกันหลายตัว (ใช้ในกรณี A→A)
- `whenTrue(predicate, fn)` — higher-order function สำหรับ conditional transform
- `tapEcho(observe)` — higher-order function สำหรับสังเกตค่าระหว่างทางโดยไม่เปลี่ยนค่า

ตัวอย่างการใช้งานจริงใน `game/ordeal.ts`:
```ts
const finalDelta = [
  applyCoinfavor(sigils),
  applyLossward(sigils),
  applyWarding(relics.warding > 0),
].reduce((delta, transform) => transform(delta), rawDelta);
```
ซึ่งเป็นการ compose ฟังก์ชันแบบ pipeline ตามแนวคิดเดียวกับ `weaveAll`

### Immutability
`Vessel` และทุก field ย่อยเป็น `readonly` ทั้งหมด (ดู `types/mythos.ts`) การอัปเดต state
ทุกจุดใช้ spread (`{ ...vessel, ... }`) ไม่มีการ mutate array/object เดิมที่ใดเลยในโปรเจกต์

### Higher-order functions ที่ใช้จริง
- `applyCoinfavor(sigils)`, `applyLossward(sigils)`, `applyWarding(hasWarding)`, `applyAscendrite(sigils)`,
  `applyResonance(history)` — ทั้งหมดคืนฟังก์ชันใหม่ (currying pattern) เพื่อนำไป compose ต่อได้

---

## 7. แนวทางขยายต่อ (สำหรับใครอยากต่อยอด)
- เพิ่มสัตว์/สัญลักษณ์เพิ่มเติมใน `ALL_GLYPHS` (ต้องอัปเดต `glyphLabel` ใน `screens.ts` ด้วย)
- เพิ่มของวิเศษใหม่ใน `bazaarGoods` — เพียงเพิ่ม `BazaarGood` object ใหม่ ระบบจะรองรับอัตโนมัติ
- เพิ่มภารกิจใหม่ใน `initialRites` — รองรับเงื่อนไขใหม่ได้โดยเพิ่ม case ใน `RiteCondition`
- ปรับสมดุลเกมได้ที่ค่าคงที่ใน `game/progression.ts` (เช่น `SATIETY_DECAY_PER_ORDEAL`, `MAX_ASCEND_LEVEL`)

ขอให้สนุกกับการดวลชะตากับเจ้ามือเงา 🐯🦀🐟🍐🦐🐓
