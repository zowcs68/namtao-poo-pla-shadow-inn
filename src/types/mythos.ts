/**
 * mythos.ts
 * ----------------------------------------------------------------------------
 * "ตำนานโลกเกม" — นิยามชนิดข้อมูลทั้งหมดของ "โรงเตี๊ยมเงาราตรี"
 * ไฟล์นี้ไม่มีฟังก์ชันใด ๆ มีแต่ type/interface ล้วน ๆ (ไม่มี side effect)
 * ----------------------------------------------------------------------------
 */

/** สัญลักษณ์ทั้ง 6 บนลูกเต๋าน้ำเต้าปูปลา */
export type Glyph = 'gourd' | 'crab' | 'fish' | 'rooster' | 'shrimp' | 'tiger';

export const ALL_GLYPHS: readonly Glyph[] = ['gourd', 'crab', 'fish', 'rooster', 'shrimp', 'tiger'];

/** ชื่อฉาก (จอ) ที่ผู้เล่นกำลังยืนอยู่ในโรงเตี๊ยม */
export type HallName =
  | 'gate'          // หน้าประตูโรงเตี๊ยม (title screen)
  | 'courtyard'     // ลานกลาง (เมนูหลัก)
  | 'wagerRoom'     // ห้องวางเดิมพัน (เลือกสัญลักษณ์ + จำนวนเงิน)
  | 'ordealResult'  // ผลการดวลกับเจ้ามือเงา
  | 'bazaar'        // ตลาดเร้นลับ
  | 'sigilAltar'    // แท่นสลักตราสัญลักษณ์ (อัปเกรด)
  | 'ritesBoard'     // ป้ายภารกิจ
  | 'ashes'         // จบเกม (แพ้)
  | 'ascension';    // จบเกม (ชนะ/ถึงเลเวลสูงสุด)

/** ตราสัญลักษณ์ 3 สายที่ผู้เล่นสามารถสลักได้จาก sigilPoints */
export type SigilPath = 'coinfavor' | 'lossward' | 'ascendrite';

/** ระดับของแต่ละสายตราสัญลักษณ์ (immutable record) */
export interface SigilLoadout {
  readonly coinfavor: number;   // เพิ่ม % เงินรางวัลที่ได้รับ
  readonly lossward: number;    // ลด % เงินที่เสียเมื่อแพ้
  readonly ascendrite: number;  // เพิ่ม % ประสบการณ์เลเวลที่ได้รับ
}

/** ของวิเศษพิเศษ (relics) ที่หาได้จากตลาดหรือภารกิจ */
export interface RelicSatchel {
  readonly magnifier: number;  // แว่นขยาย: จำนวนที่ถือ ใช้แล้วหมดไปทีละชิ้น
  readonly warding: number;    // ประกันภัย: จำนวนที่ถือ ใช้แล้วหมดไปทีละชิ้น
}

/** เงื่อนไขความสำเร็จของภารกิจ (rite) แต่ละแบบ */
export type RiteCondition =
  | { readonly kind: 'streakOf'; readonly amount: number }
  | { readonly kind: 'victoriesTotal'; readonly amount: number }
  | { readonly kind: 'ascendReach'; readonly amount: number }
  | { readonly kind: 'coinSpentTotal'; readonly amount: number };

/** ภารกิจหนึ่งชิ้นบนป้ายประกาศ */
export interface Rite {
  readonly id: string;
  readonly title: string;
  readonly lore: string;
  readonly condition: RiteCondition;
  readonly rewardCoin: number;
  readonly rewardAscendPoints: number;
  readonly claimed: boolean;
}

/** ประวัติผลแต่ละดวล ใช้คำนวณ resonance streak */
export type OrdealOutcome = 'victory' | 'defeat';

/** สินค้าที่วางขายในตลาดเร้นลับ */
export interface BazaarGood {
  readonly id: string;
  readonly name: string;
  readonly lore: string;
  readonly price: number;
  readonly effect: BazaarEffect;
}

export type BazaarEffect =
  | { readonly kind: 'restoreSatiety'; readonly amount: number }
  | { readonly kind: 'grantSigilPoints'; readonly amount: number }
  | { readonly kind: 'grantRelic'; readonly relic: keyof RelicSatchel; readonly amount: number };

/** เดิมพันที่ผู้เล่นวางไว้ก่อนดวลกับเจ้ามือเงา */
export interface Wager {
  readonly glyph: Glyph;
  readonly amount: number;
}

/**
 * Vessel = "ร่างจดจำ" ของผู้เล่น — ก้อน state เดียวที่ถือทุกอย่างไว้แบบ immutable
 * ทุกการเปลี่ยนแปลงต้องสร้าง Vessel ใหม่เสมอ (ห้าม mutate)
 */
export interface Vessel {
  readonly hall: HallName;
  readonly coin: number;
  readonly ascendLevel: number;       // 0..30
  readonly ascendProgress: number;    // แต้มสะสมภายในเลเวลปัจจุบัน
  readonly sigilPoints: number;       // stack ที่ยังไม่ได้ใช้
  readonly sigils: SigilLoadout;
  readonly satiety: number;           // ความอิ่ม 0..100 (คือ "ความหิว" กลับด้าน)
  readonly hearts: number;            // 0..3
  readonly relics: RelicSatchel;
  readonly rites: readonly Rite[];
  readonly ordealHistory: readonly OrdealOutcome[];
  readonly pendingWager: Wager | null;
  readonly lastDice: readonly Glyph[] | null;
  readonly magnifierHint: Glyph | null; // คำใบ้จากแว่นขยายสำหรับดวลถัดไป
  readonly coinSpentTotal: number;
  readonly tavernNightsSurvived: number; // จำนวนรอบที่เล่นผ่านมา
  readonly rngCore: number;           // เมล็ดพันธุ์สุ่มปัจจุบัน (pure LCG state)
  readonly chronicle: readonly string[]; // ข้อความล่าสุดที่จะแสดง/บันทึก
  readonly alive: boolean;
  readonly won: boolean;
}

/**
 * Omen = "ลางบอกเหตุ" คือ Action ที่ผลักดัน state transition
 * ผู้เล่นทุกการกระทำจะถูกแปลงเป็น Omen ก่อนส่งเข้า fateWeaver (reducer)
 */
export type Omen =
  | { readonly type: 'STEP_INTO_COURTYARD' }
  | { readonly type: 'ENTER_WAGER_ROOM' }
  | { readonly type: 'RAISE_WAGER'; readonly glyph: Glyph; readonly amount: number }
  | { readonly type: 'FACE_THE_DEALER' }
  | { readonly type: 'RETREAT_TO_COURTYARD' }
  | { readonly type: 'ENTER_BAZAAR' }
  | { readonly type: 'PURCHASE_GOOD'; readonly goodId: string }
  | { readonly type: 'ENTER_SIGIL_ALTAR' }
  | { readonly type: 'INSCRIBE_SIGIL'; readonly path: SigilPath }
  | { readonly type: 'SHATTER_SIGILS' }
  | { readonly type: 'ENTER_RITES_BOARD' }
  | { readonly type: 'CLAIM_RITE'; readonly riteId: string }
  | { readonly type: 'CONSUME_MAGNIFIER' }
  | { readonly type: 'QUIT_TAVERN' };

/** ผลลัพธ์ของ fateWeaver: state ใหม่ + ข้อความบรรยายเหตุการณ์ (สำหรับ IO layer เอาไปแสดง/บันทึก) */
export interface FateResult {
  readonly vessel: Vessel;
  readonly echoes: readonly string[];
}
