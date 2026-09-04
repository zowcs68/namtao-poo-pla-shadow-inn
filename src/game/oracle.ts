/**
 * oracle.ts
 * ----------------------------------------------------------------------------
 * "คำทำนายแห่งเงาราตรี" — ระบบสุ่มทั้งหมดของเกม เขียนเป็น pure function ล้วน ๆ
 * ไม่มีการเรียก Math.random() ในไฟล์นี้เลย ทุกอย่างคำนวณจาก seed (rngCore)
 * ซึ่งไหลอยู่ใน Vessel — ทำให้ผลลัพธ์ reproducible และ testable 100%
 * ----------------------------------------------------------------------------
 */

import { ALL_GLYPHS, Glyph } from '../types/mythos';

/** advanceSeed: สูตร LCG (Linear Congruential Generator) แบบ pure — คืน seed ถัดไป */
export const advanceSeed = (seed: number): number => (seed * 1103515245 + 12345) & 0x7fffffff;

/** seedToUnitInterval: แปลง seed เป็นเลขทศนิยม [0, 1) แบบ pure */
export const seedToUnitInterval = (seed: number): number => seed / 0x80000000;

/** drawIndex: ดึงดัชนี [0, bound) แบบ pure จาก seed หนึ่งค่า พร้อมคืน seed ถัดไปกลับมาด้วย */
export interface Draw<T> {
  readonly value: T;
  readonly nextSeed: number;
}

export const drawIndex = (seed: number, bound: number): Draw<number> => {
  const advanced = advanceSeed(seed);
  const index = Math.floor(seedToUnitInterval(advanced) * bound);
  return { value: Math.min(index, bound - 1), nextSeed: advanced };
};

/** drawGlyph: สุ่มสัญลักษณ์หนึ่งดวงตราจากลูกเต๋าน้ำเต้าปูปลา 6 หน้า แบบ pure */
export const drawGlyph = (seed: number): Draw<Glyph> => {
  const draw = drawIndex(seed, ALL_GLYPHS.length);
  const glyph = ALL_GLYPHS[draw.value];
  if (glyph === undefined) {
    throw new Error('oracle: unreachable glyph index');
  }
  return { value: glyph, nextSeed: draw.nextSeed };
};

/** rollThreeDice: หมุนลูกเต๋าสามลูกรวดเดียว (แกนของการดวลน้ำเต้าปูปลา) แบบ pure */
export const rollThreeDice = (seed: number): Draw<readonly Glyph[]> => {
  const first = drawGlyph(seed);
  const second = drawGlyph(first.nextSeed);
  const third = drawGlyph(second.nextSeed);
  return {
    value: [first.value, second.value, third.value],
    nextSeed: third.nextSeed,
  };
};

/** freshSeedFromClock: จุดเดียวในทั้งโปรเจกต์ที่แตะนาฬิกาของเครื่อง (impure) เพื่อสร้าง seed เริ่มต้น */
export const freshSeedFromClock = (): number => Date.now() & 0x7fffffff;
