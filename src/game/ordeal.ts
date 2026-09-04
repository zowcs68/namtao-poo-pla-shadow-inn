/**
 * ordeal.ts
 * ----------------------------------------------------------------------------
 * "การดวลกับเจ้ามือเงา" — แกนกลางของเกมน้ำเต้าปูปลา
 * รับเดิมพัน + ลูกเต๋าที่ทอยได้ + สถานะตราสัญลักษณ์/ของวิเศษ แล้วคำนวณผลลัพธ์
 * ทุกฟังก์ชันในไฟล์นี้เป็น pure function — ไม่แตะ state, ไม่มี I/O
 * ----------------------------------------------------------------------------
 */

import { Glyph, RelicSatchel, SigilLoadout, Wager } from '../types/mythos';

export interface OrdealVerdict {
  readonly matches: number;           // จำนวนลูกเต๋าที่ตรงกับสัญลักษณ์ที่วางเดิมพัน
  readonly isVictory: boolean;
  readonly coinDelta: number;         // เงินที่ได้ (บวก) หรือเสีย (ลบ) สุทธิ หลังคูณตราสัญลักษณ์/ของวิเศษ
  readonly ascendPointsGained: number;
}

/** countMatches: นับจำนวนลูกเต๋าที่ตรงกับสัญลักษณ์เดิมพัน — pure */
export const countMatches = (dice: readonly Glyph[], glyph: Glyph): number =>
  dice.reduce((total, face) => (face === glyph ? total + 1 : total), 0);

/** baseCoinDelta: กติกาน้ำเต้าปูปลาแบบดั้งเดิม — ตรง 1=ได้1เท่า, 2=ได้2เท่า, 3=ได้3เท่า, ไม่ตรง=เสียเดิมพันทั้งหมด */
export const baseCoinDelta = (wager: Wager, matches: number): number =>
  matches > 0 ? wager.amount * matches : -wager.amount;

/** applyCoinfavor: ตราสัญลักษณ์สาย coinfavor เพิ่ม % เงินรางวัลเมื่อชนะ — pure */
export const applyCoinfavor = (sigils: SigilLoadout) => (delta: number): number =>
  delta > 0 ? Math.round(delta * (1 + sigils.coinfavor * 0.08)) : delta;

/** applyLossward: ตราสัญลักษณ์สาย lossward ลด % เงินที่เสียเมื่อแพ้ — pure */
export const applyLossward = (sigils: SigilLoadout) => (delta: number): number =>
  delta < 0 ? Math.round(delta * (1 - Math.min(sigils.lossward * 0.08, 0.8))) : delta;

/** applyWarding: ประกันภัย (relic) ลดการสูญเสียเพิ่มอีกชั้นเมื่อแพ้ ใช้แล้วหมดไปทีละครั้ง — pure (การหักจำนวน relic ทำที่ reducer) */
export const applyWarding = (hasWarding: boolean) => (delta: number): number =>
  delta < 0 && hasWarding ? Math.round(delta * 0.5) : delta;

/** ascendPointsFromMatches: คะแนนเลเวลที่ได้รับ ขึ้นกับจำนวนลูกเต๋าตรง แม้แพ้ก็ยังได้ประสบการณ์เล็กน้อย — pure */
export const ascendPointsFromMatches = (matches: number): number => (matches > 0 ? matches * 2 : 1);

/** applyAscendrite: ตราสัญลักษณ์สาย ascendrite เพิ่ม % คะแนนเลเวลที่ได้ — pure */
export const applyAscendrite = (sigils: SigilLoadout) => (points: number): number =>
  Math.round(points * (1 + sigils.ascendrite * 0.1));

/**
 * judgeOrdeal: ฟังก์ชันหลักที่ประกอบ pure function ย่อยทั้งหมดข้างต้นเข้าด้วยกัน
 * เพื่อตัดสินผลการดวลหนึ่งครั้ง — คืนค่า OrdealVerdict ที่ไม่แตะ state ใด ๆ ทั้งสิ้น
 */
export const judgeOrdeal = (
  wager: Wager,
  dice: readonly Glyph[],
  sigils: SigilLoadout,
  relics: RelicSatchel
): OrdealVerdict => {
  const matches = countMatches(dice, wager.glyph);
  const rawDelta = baseCoinDelta(wager, matches);

  const finalDelta = [
    applyCoinfavor(sigils),
    applyLossward(sigils),
    applyWarding(relics.warding > 0),
  ].reduce((delta, transform) => transform(delta), rawDelta);

  const ascendPointsGained = applyAscendrite(sigils)(ascendPointsFromMatches(matches));

  return {
    matches,
    isVictory: matches > 0,
    coinDelta: finalDelta,
    ascendPointsGained,
  };
};
