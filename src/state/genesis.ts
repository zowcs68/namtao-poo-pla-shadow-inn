/**
 * genesis.ts
 * ----------------------------------------------------------------------------
 * "จุดกำเนิดร่างจดจำ" — สร้าง Vessel เริ่มต้นของผู้เล่นใหม่
 * รับ seed เข้ามาจากภายนอก (ผู้เรียกเป็นฝ่าย impure ที่ไปเอา seed จากนาฬิกา)
 * ฟังก์ชันในไฟล์นี้เองยังคงเป็น pure เพราะ output ขึ้นกับ input (seed) เท่านั้น
 * ----------------------------------------------------------------------------
 */

import { initialRites } from '../game/rites';
import { Vessel } from '../types/mythos';

export const spawnVessel = (seed: number): Vessel => ({
  hall: 'gate',
  coin: 100,
  ascendLevel: 0,
  ascendProgress: 0,
  sigilPoints: 0,
  sigils: { coinfavor: 0, lossward: 0, ascendrite: 0 },
  satiety: 100,
  hearts: 3,
  relics: { magnifier: 0, warding: 0 },
  rites: initialRites,
  ordealHistory: [],
  pendingWager: null,
  lastDice: null,
  magnifierHint: null,
  coinSpentTotal: 0,
  tavernNightsSurvived: 0,
  rngCore: seed,
  chronicle: ['เจ้าก้าวเข้าสู่ประตูโรงเตี๊ยมเงาราตรี กลิ่นธูปและเสียงลูกเต๋ากระทบโต๊ะไม้เก่าลอยมาแตะจมูก...'],
  alive: true,
  won: false,
});
