/**
 * rites.ts
 * ----------------------------------------------------------------------------
 * "พิธีกรรมแห่งโรงเตี๊ยม" — ระบบภารกิจ
 * นิยามภารกิจตั้งต้น + pure function ตรวจสอบเงื่อนไขความสำเร็จ
 * ----------------------------------------------------------------------------
 */

import { Rite, RiteCondition, Vessel } from '../types/mythos';
import { currentStreakLength } from './resonance';

/** initialRites: รายการภารกิจตั้งต้นทั้งหมดของโรงเตี๊ยม (ค่าคงที่ ไม่แปรผัน) */
export const initialRites: readonly Rite[] = [
  {
    id: 'rite-first-blood',
    title: 'ชัยชนะแรกในเงามืด',
    lore: 'เอาชนะเจ้ามือเงาให้ได้สักครั้งหนึ่ง เพื่อพิสูจน์ว่าเจ้ายังมีลมหายใจ',
    condition: { kind: 'victoriesTotal', amount: 1 },
    rewardCoin: 30,
    rewardAscendPoints: 5,
    claimed: false,
  },
  {
    id: 'rite-triple-echo',
    title: 'เสียงก้องสามชั้น',
    lore: 'ชนะติดต่อกันสามดวลรวด ให้เสียงก้องแห่งโชคดังกึกก้องทั่วโรงเตี๊ยม',
    condition: { kind: 'streakOf', amount: 3 },
    rewardCoin: 80,
    rewardAscendPoints: 10,
    claimed: false,
  },
  {
    id: 'rite-tenfold-dealer',
    title: 'ผู้พิชิตสิบดวล',
    lore: 'สะสมชัยชนะรวมสิบครั้งตลอดการมาเยือนโรงเตี๊ยมแห่งนี้',
    condition: { kind: 'victoriesTotal', amount: 10 },
    rewardCoin: 150,
    rewardAscendPoints: 20,
    claimed: false,
  },
  {
    id: 'rite-ascend-ten',
    title: 'บันไดสู่เลเวลสิบ',
    lore: 'ไต่ระดับจิตวิญญาณของเจ้าให้ถึงเลเวล 10',
    condition: { kind: 'ascendReach', amount: 10 },
    rewardCoin: 200,
    rewardAscendPoints: 0,
    claimed: false,
  },
  {
    id: 'rite-big-spender',
    title: 'ผู้อุปถัมภ์ตลาดเร้นลับ',
    lore: 'ใช้จ่ายเงินในตลาดเร้นลับรวมกันให้ถึง 300 เหรียญ',
    condition: { kind: 'coinSpentTotal', amount: 300 },
    rewardCoin: 100,
    rewardAscendPoints: 15,
    claimed: false,
  },
  {
    id: 'rite-master-of-shadows',
    title: 'เจ้าแห่งเงาราตรี',
    lore: 'ไต่ระดับจิตวิญญาณของเจ้าให้ถึงเลเวลสูงสุด 30',
    condition: { kind: 'ascendReach', amount: 30 },
    rewardCoin: 500,
    rewardAscendPoints: 0,
    claimed: false,
  },
];

const victoriesTotal = (vessel: Vessel): number =>
  vessel.ordealHistory.reduce((total, outcome) => (outcome === 'victory' ? total + 1 : total), 0);

/** isConditionMet: ตรวจสอบเงื่อนไขภารกิจหนึ่งข้อเทียบกับสถานะปัจจุบัน — pure */
export const isConditionMet = (condition: RiteCondition, vessel: Vessel): boolean => {
  switch (condition.kind) {
    case 'streakOf':
      return currentStreakLength(vessel.ordealHistory) >= condition.amount;
    case 'victoriesTotal':
      return victoriesTotal(vessel) >= condition.amount;
    case 'ascendReach':
      return vessel.ascendLevel >= condition.amount;
    case 'coinSpentTotal':
      return vessel.coinSpentTotal >= condition.amount;
    default: {
      const exhaustiveCheck: never = condition;
      return exhaustiveCheck;
    }
  }
};

/** eligibleUnclaimedRites: กรองเฉพาะภารกิจที่ยังไม่รับรางวัลและเงื่อนไขครบแล้ว — pure */
export const eligibleUnclaimedRites = (vessel: Vessel): readonly Rite[] =>
  vessel.rites.filter((rite) => !rite.claimed && isConditionMet(rite.condition, vessel));
