/**
 * progression.ts
 * ----------------------------------------------------------------------------
 * "เส้นทางไต่บันไดจิตวิญญาณ" — ระบบเลเวล (ascend), ความอิ่ม (satiety), และหัวใจ
 * ทุกฟังก์ชันเป็น pure function ล้วน รับค่าปัจจุบันคืนค่าใหม่ ไม่ mutate อะไรทั้งสิ้น
 * ----------------------------------------------------------------------------
 */

export const MAX_ASCEND_LEVEL = 30;
export const PROGRESS_PER_LEVEL = 100;
export const SIGIL_POINTS_PER_LEVEL = 3;
export const MAX_HEARTS = 3;
export const MAX_SATIETY = 100;
export const SATIETY_DECAY_PER_ORDEAL = 12;

export interface AscendOutcome {
  readonly ascendLevel: number;
  readonly ascendProgress: number;
  readonly sigilPointsGained: number;
  readonly leveledUp: boolean;
}

/**
 * applyAscendPoints: บวกแต้มประสบการณ์เข้าไป แล้วคำนวณว่าขึ้นเลเวลกี่ครั้ง
 * รองรับกรณีได้แต้มเยอะจนขึ้นหลายเลเวลรวดเดียว — pure, เขียนแบบ recursive ไม่ใช้ loop ที่ mutate ตัวแปร
 */
export const applyAscendPoints = (
  currentLevel: number,
  currentProgress: number,
  pointsGained: number
): AscendOutcome => {
  if (currentLevel >= MAX_ASCEND_LEVEL) {
    return {
      ascendLevel: MAX_ASCEND_LEVEL,
      ascendProgress: 0,
      sigilPointsGained: 0,
      leveledUp: false,
    };
  }

  const totalProgress = currentProgress + pointsGained;

  const climb = (level: number, progress: number, sigilAcc: number, leveledAny: boolean): AscendOutcome => {
    if (level >= MAX_ASCEND_LEVEL) {
      return { ascendLevel: MAX_ASCEND_LEVEL, ascendProgress: 0, sigilPointsGained: sigilAcc, leveledUp: leveledAny };
    }
    if (progress < PROGRESS_PER_LEVEL) {
      return { ascendLevel: level, ascendProgress: progress, sigilPointsGained: sigilAcc, leveledUp: leveledAny };
    }
    return climb(level + 1, progress - PROGRESS_PER_LEVEL, sigilAcc + SIGIL_POINTS_PER_LEVEL, true);
  };

  return climb(currentLevel, totalProgress, 0, false);
};

/** decaySatiety: ลดความอิ่มลงตามจำนวนที่กำหนด ไม่ให้ติดลบ — pure */
export const decaySatiety = (satiety: number, amount: number = SATIETY_DECAY_PER_ORDEAL): number =>
  Math.max(0, satiety - amount);

/** restoreSatiety: เพิ่มความอิ่ม ไม่ให้เกินเพดาน — pure */
export const restoreSatiety = (satiety: number, amount: number): number =>
  Math.min(MAX_SATIETY, satiety + amount);

export interface StarvationCheck {
  readonly satiety: number;
  readonly hearts: number;
  readonly heartLost: boolean;
}

/**
 * checkStarvation: ถ้าความอิ่มแตะ 0 ให้หักหัวใจหนึ่งดวงและเติมความอิ่มกลับมาครึ่งหนึ่ง
 * (ให้โอกาสไปหาอาหารต่อ แทนที่จะตายจากความหิวทันที) — pure
 */
export const checkStarvation = (satiety: number, hearts: number): StarvationCheck => {
  if (satiety > 0) {
    return { satiety, hearts, heartLost: false };
  }
  const nextHearts = Math.max(0, hearts - 1);
  return { satiety: Math.round(MAX_SATIETY * 0.4), hearts: nextHearts, heartLost: true };
};

/** isDefeated: ผู้เล่นตายเมื่อหัวใจหมดหรือเงินหมด (และไม่มีทางกู้เงินคืนแล้ว) — pure */
export const isDefeated = (hearts: number, coin: number): boolean => hearts <= 0 || coin <= 0;

/** hasAscended: ถือว่าจบเกมแบบชนะเมื่อไต่ถึงเลเวลสูงสุด */
export const hasAscended = (ascendLevel: number): boolean => ascendLevel >= MAX_ASCEND_LEVEL;
