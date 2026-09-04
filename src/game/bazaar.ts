/**
 * bazaar.ts
 * ----------------------------------------------------------------------------
 * "ตลาดเร้นลับ" — ระบบร้านค้า
 * นิยามสินค้าตั้งต้น + pure function คำนวณผลของการซื้อ (ไม่แตะ state จริง)
 * ----------------------------------------------------------------------------
 */

import { BazaarGood, RelicSatchel, SigilLoadout } from '../types/mythos';

/** bazaarGoods: รายการสินค้าคงที่ในตลาดเร้นลับ */
export const bazaarGoods: readonly BazaarGood[] = [
  {
    id: 'good-rice-porridge',
    name: 'ข้าวต้มร้อนกรุ่น',
    lore: 'อุ่นท้องได้ทันที คลายความหิวโหยลงไปมาก',
    price: 15,
    effect: { kind: 'restoreSatiety', amount: 35 },
  },
  {
    id: 'good-roasted-skewer',
    name: 'ไม้ปิ้งย่างริมทาง',
    lore: 'หอมกรุ่นทั่วโรงเตี๊ยม อิ่มพอประทังไปอีกหลายดวล',
    price: 8,
    effect: { kind: 'restoreSatiety', amount: 18 },
  },
  {
    id: 'good-sigil-shard',
    name: 'เศษตราสัญลักษณ์',
    lore: 'เศษพลังที่ร่วงจากแท่นสลัก แลกได้เป็นแต้มสำหรับจารึกตราเพิ่มเติม',
    price: 60,
    effect: { kind: 'grantSigilPoints', amount: 1 },
  },
  {
    id: 'good-magnifier-lens',
    name: 'แว่นขยายแห่งเงา',
    lore: 'ส่องเห็นเงาลาง ๆ ของลูกเต๋าลูกหนึ่งก่อนทอย',
    price: 45,
    effect: { kind: 'grantRelic', relic: 'magnifier', amount: 1 },
  },
  {
    id: 'good-warding-charm',
    name: 'เครื่องรางประกันภัย',
    lore: 'ปกป้องกระเป๋าเงินของเจ้าจากความสูญเสียครั้งใหญ่ในดวลถัดไป',
    price: 55,
    effect: { kind: 'grantRelic', relic: 'warding', amount: 1 },
  },
];

export const findGood = (goodId: string): BazaarGood | undefined =>
  bazaarGoods.find((good) => good.id === goodId);

export interface PurchaseEffect {
  readonly satietyDelta: number;
  readonly sigilPointsDelta: number;
  readonly relicsDelta: Partial<RelicSatchel>;
}

/** resolvePurchaseEffect: แปลง BazaarEffect เป็นผลลัพธ์ตัวเลขล้วน ๆ แบบ pure */
export const resolvePurchaseEffect = (good: BazaarGood): PurchaseEffect => {
  switch (good.effect.kind) {
    case 'restoreSatiety':
      return { satietyDelta: good.effect.amount, sigilPointsDelta: 0, relicsDelta: {} };
    case 'grantSigilPoints':
      return { satietyDelta: 0, sigilPointsDelta: good.effect.amount, relicsDelta: {} };
    case 'grantRelic':
      return {
        satietyDelta: 0,
        sigilPointsDelta: 0,
        relicsDelta: { [good.effect.relic]: good.effect.amount },
      };
    default: {
      const exhaustiveCheck: never = good.effect;
      return exhaustiveCheck;
    }
  }
};

/** canAfford: ตรวจสอบว่าเงินคงเหลือพอซื้อสินค้านั้นหรือไม่ — pure */
export const canAfford = (coin: number, good: BazaarGood): boolean => coin >= good.price;

/** sigilInvestmentCost: ต้นทุน sigilPoints ต่อการจารึกหนึ่งครั้ง (คงที่ไว้เผื่อขยายในอนาคต) */
export const SIGIL_INSCRIBE_COST = 1;

/** inscribeSigil: เพิ่มระดับตราสัญลักษณ์หนึ่งสายทีละ 1 ระดับ — pure, คืน loadout ใหม่ */
export const inscribeSigil = (
  sigils: SigilLoadout,
  path: keyof SigilLoadout
): SigilLoadout => ({
  ...sigils,
  [path]: sigils[path] + 1,
});

/** shatterSigils: รีเซ็ตตราสัญลักษณ์ทั้งหมดกลับเป็นศูนย์ (คืน sigilPoints ที่เคยลงทุนไปครึ่งหนึ่ง) — pure */
export const shatterSigils = (
  sigils: SigilLoadout
): { readonly sigils: SigilLoadout; readonly refundedPoints: number } => {
  const invested = sigils.coinfavor + sigils.lossward + sigils.ascendrite;
  const refundedPoints = Math.floor(invested / 2);
  return {
    sigils: { coinfavor: 0, lossward: 0, ascendrite: 0 },
    refundedPoints,
  };
};
