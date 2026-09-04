/**
 * gaze.ts
 * ----------------------------------------------------------------------------
 * "สายตาที่มองทะลุร่างจดจำ" — รวม pure selector functions ที่คำนวณค่าอนุพันธ์
 * จาก Vessel โดยไม่แก้ไข Vessel เลย ใช้สำหรับให้ชั้น UI เอาไปแสดงผล
 * ----------------------------------------------------------------------------
 */

import { resonanceMultiplier } from '../game/resonance';
import { eligibleUnclaimedRites } from '../game/rites';
import { MAX_ASCEND_LEVEL, MAX_HEARTS, MAX_SATIETY, PROGRESS_PER_LEVEL } from '../game/progression';
import { Vessel } from '../types/mythos';

export const heartsDisplay = (vessel: Vessel): string =>
  '♥'.repeat(vessel.hearts) + '♡'.repeat(Math.max(0, MAX_HEARTS - vessel.hearts));

export const satietyPercent = (vessel: Vessel): number =>
  Math.round((vessel.satiety / MAX_SATIETY) * 100);

export const ascendProgressPercent = (vessel: Vessel): number =>
  Math.round((vessel.ascendProgress / PROGRESS_PER_LEVEL) * 100);

export const isMaxAscend = (vessel: Vessel): boolean => vessel.ascendLevel >= MAX_ASCEND_LEVEL;

export const currentResonanceMultiplier = (vessel: Vessel): number =>
  resonanceMultiplier(vessel.ordealHistory);

export const claimableRiteCount = (vessel: Vessel): number => eligibleUnclaimedRites(vessel).length;

export const activeSigilSummary = (vessel: Vessel): string => {
  const { coinfavor, lossward, ascendrite } = vessel.sigils;
  return `เพิ่มรางวัล+${coinfavor * 8}% | กันขาดทุน-${Math.min(lossward * 8, 80)}% | เร่งเลเวล+${ascendrite * 10}%`;
};

export const relicSummary = (vessel: Vessel): string =>
  `แว่นขยาย x${vessel.relics.magnifier}  ประกันภัย x${vessel.relics.warding}`;
