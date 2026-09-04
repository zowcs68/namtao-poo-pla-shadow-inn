/**
 * resonance.ts
 * ----------------------------------------------------------------------------
 * "แรงก้องแห่งโชค" — ระบบ streak multiplier
 * รับประวัติผลการดวล (OrdealOutcome[]) แล้วคำนวณตัวคูณโบนัสแบบ pure function
 * ยิ่งชนะติดกันหลายดวล เสียงก้องยิ่งดังและให้โบนัสเงินมากขึ้น (จำกัดเพดานไว้)
 * ----------------------------------------------------------------------------
 */

import { OrdealOutcome } from '../types/mythos';

/** currentStreakLength: นับจำนวนชัยชนะติดต่อกันนับจากท้ายประวัติย้อนขึ้นไป — pure */
export const currentStreakLength = (history: readonly OrdealOutcome[]): number => {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i] === 'victory') {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

/** resonanceMultiplier: แปลง streak เป็นตัวคูณโบนัส เพดานที่ +50% เมื่อชนะติดกัน 5 ครั้งขึ้นไป — pure */
export const resonanceMultiplier = (history: readonly OrdealOutcome[]): number => {
  const streak = currentStreakLength(history);
  const cappedStreak = Math.min(streak, 5);
  return 1 + cappedStreak * 0.1;
};

/** applyResonance: คูณโบนัส resonance เข้ากับเงินรางวัลที่ชนะได้ (ไม่มีผลตอนแพ้) — pure, higher-order */
export const applyResonance = (history: readonly OrdealOutcome[]) => (coinDelta: number): number =>
  coinDelta > 0 ? Math.round(coinDelta * resonanceMultiplier(history)) : coinDelta;
