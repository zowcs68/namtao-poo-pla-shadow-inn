/**
 * fateWeaver.ts
 * ----------------------------------------------------------------------------
 * "ผู้ทอชะตา" — reducer หลักของเกมทั้งหมด
 * รูปแบบ: weaveFate(vessel, omen) => { vessel: Vessel ใหม่, echoes: ข้อความบรรยาย }
 * ฟังก์ชันนี้และฟังก์ชันย่อยทั้งหมดในไฟล์นี้เป็น pure function
 * ไม่มีการเรียก console.log, fs, Date.now หรือ Math.random ที่ใดเลย
 * ----------------------------------------------------------------------------
 */

import { canAfford, findGood, inscribeSigil, resolvePurchaseEffect, shatterSigils, SIGIL_INSCRIBE_COST } from '../game/bazaar';
import { rollThreeDice, drawGlyph } from '../game/oracle';
import { judgeOrdeal } from '../game/ordeal';
import {
  applyAscendPoints,
  checkStarvation,
  decaySatiety,
  hasAscended,
  isDefeated,
  restoreSatiety,
} from '../game/progression';
import { applyResonance } from '../game/resonance';
import { eligibleUnclaimedRites } from '../game/rites';
import { FateResult, Omen, Vessel } from '../types/mythos';

const withEchoes = (vessel: Vessel, echoes: readonly string[]): FateResult => ({
  vessel: { ...vessel, chronicle: echoes },
  echoes,
});

const unchanged = (vessel: Vessel, note: string): FateResult => withEchoes(vessel, [note]);

/** transitionOrdeal: ฟังก์ชันที่หนักที่สุดในเกม — คำนวณผลการดวลหนึ่งครั้งทั้งหมดแบบ pure */
const transitionOrdeal = (vessel: Vessel): FateResult => {
  const wager = vessel.pendingWager;
  if (wager === null) {
    return unchanged(vessel, 'เจ้ายังไม่ได้วางเดิมพัน ต้องเลือกสัญลักษณ์และจำนวนเงินก่อน');
  }
  if (wager.amount > vessel.coin) {
    return unchanged(vessel, 'เงินในกระเป๋าไม่พอสำหรับเดิมพันนี้');
  }

  const diceDraw = rollThreeDice(vessel.rngCore);
  const verdict = judgeOrdeal(wager, diceDraw.value, vessel.sigils, vessel.relics);
  const resonantDelta = applyResonance(vessel.ordealHistory)(verdict.coinDelta);

  const wardingUsed = resonantDelta < 0 && vessel.relics.warding > 0;
  const nextRelics = wardingUsed
    ? { ...vessel.relics, warding: vessel.relics.warding - 1 }
    : vessel.relics;

  const nextCoin = Math.max(0, vessel.coin + resonantDelta);
  const ascendOutcome = applyAscendPoints(vessel.ascendLevel, vessel.ascendProgress, verdict.ascendPointsGained);
  const decayedSatiety = decaySatiety(vessel.satiety);
  const starvation = checkStarvation(decayedSatiety, vessel.hearts);

  const nextHistory = [...vessel.ordealHistory, verdict.isVictory ? ('victory' as const) : ('defeat' as const)];

  const defeated = isDefeated(starvation.hearts, nextCoin);
  const ascended = hasAscended(ascendOutcome.ascendLevel);

  const nextHall = defeated ? 'ashes' : ascended ? 'ascension' : 'ordealResult';

  const nextVessel: Vessel = {
    ...vessel,
    hall: nextHall,
    coin: nextCoin,
    ascendLevel: ascendOutcome.ascendLevel,
    ascendProgress: ascendOutcome.ascendProgress,
    sigilPoints: vessel.sigilPoints + ascendOutcome.sigilPointsGained,
    satiety: starvation.satiety,
    hearts: starvation.hearts,
    relics: nextRelics,
    ordealHistory: nextHistory,
    pendingWager: null,
    lastDice: diceDraw.value,
    magnifierHint: null,
    tavernNightsSurvived: vessel.tavernNightsSurvived + 1,
    rngCore: diceDraw.nextSeed,
    alive: !defeated,
    won: ascended,
  };

  const echoes: string[] = [
    `เจ้ามือเงาทอยลูกเต๋าออกมา: ${diceDraw.value.join(', ')}`,
    verdict.isVictory
      ? `ตรงกัน ${verdict.matches} ลูก! เจ้าได้รับ ${resonantDelta} เหรียญ`
      : `ไม่มีลูกใดตรงกับ "${wager.glyph}" เจ้าเสียเงินไป ${Math.abs(resonantDelta)} เหรียญ`,
    ascendOutcome.leveledUp ? `จิตวิญญาณของเจ้าไต่ขึ้นสู่เลเวล ${ascendOutcome.ascendLevel}!` : '',
    wardingUsed ? 'เครื่องรางประกันภัยแตกสลาย ปกป้องเจ้าจากความสูญเสียครั้งใหญ่' : '',
    starvation.heartLost ? 'ความหิวโหยกัดกินจนหัวใจดวงหนึ่งแตกสลาย!' : '',
    defeated ? 'เจ้าล้มลงในโรงเตี๊ยมเงาราตรี... การเดินทางจบลงเพียงเท่านี้' : '',
    ascended ? 'เจ้าไต่ถึงจุดสูงสุดแห่งจิตวิญญาณ! เจ้าคือผู้พิชิตโรงเตี๊ยมเงาราตรี!' : '',
  ].filter((line) => line.length > 0);

  return withEchoes(nextVessel, echoes);
};

/** weaveFate: จุดเข้าเดียวของ reducer — รับ Omen แล้ว dispatch ไปยัง transition function ที่เหมาะสม */
export const weaveFate = (vessel: Vessel, omen: Omen): FateResult => {
  if (!vessel.alive && omen.type !== 'QUIT_TAVERN') {
    return unchanged(vessel, 'เรื่องราวได้จบลงแล้ว โปรดเริ่มโปรแกรมใหม่เพื่อเดินทางอีกครั้ง');
  }

  switch (omen.type) {
    case 'STEP_INTO_COURTYARD':
      return unchanged({ ...vessel, hall: 'courtyard' }, 'เจ้าก้าวเข้าสู่ลานกลางโรงเตี๊ยม');

    case 'ENTER_WAGER_ROOM':
      return unchanged({ ...vessel, hall: 'wagerRoom' }, 'เจ้าก้าวเข้าห้องวางเดิมพัน เจ้ามือเงารอเจ้าอยู่แล้ว');

    case 'RAISE_WAGER': {
      if (omen.amount <= 0) {
        return unchanged(vessel, 'จำนวนเดิมพันต้องมากกว่าศูนย์');
      }
      if (omen.amount > vessel.coin) {
        return unchanged(vessel, 'เจ้ามีเงินไม่พอสำหรับเดิมพันจำนวนนี้');
      }
      return unchanged(
        { ...vessel, pendingWager: { glyph: omen.glyph, amount: omen.amount } },
        `เจ้าวางเดิมพัน ${omen.amount} เหรียญ บนสัญลักษณ์ "${omen.glyph}"`
      );
    }

    case 'FACE_THE_DEALER':
      return transitionOrdeal(vessel);

    case 'RETREAT_TO_COURTYARD':
      return unchanged(
        { ...vessel, hall: 'courtyard', pendingWager: null, lastDice: null },
        'เจ้าถอยกลับสู่ลานกลาง หายใจเข้าลึก ๆ'
      );

    case 'ENTER_BAZAAR':
      return unchanged({ ...vessel, hall: 'bazaar' }, 'เจ้าก้าวเข้าสู่ตลาดเร้นลับ แสงเทียนสีม่วงลอยระเรื่อ');

    case 'PURCHASE_GOOD': {
      const good = findGood(omen.goodId);
      if (good === undefined) {
        return unchanged(vessel, 'ไม่พบสินค้าชิ้นนี้ในตลาด');
      }
      if (!canAfford(vessel.coin, good)) {
        return unchanged(vessel, `เงินไม่พอซื้อ "${good.name}"`);
      }
      const effect = resolvePurchaseEffect(good);
      const nextVessel: Vessel = {
        ...vessel,
        coin: vessel.coin - good.price,
        coinSpentTotal: vessel.coinSpentTotal + good.price,
        satiety: restoreSatiety(vessel.satiety, effect.satietyDelta),
        sigilPoints: vessel.sigilPoints + effect.sigilPointsDelta,
        relics: {
          magnifier: vessel.relics.magnifier + (effect.relicsDelta.magnifier ?? 0),
          warding: vessel.relics.warding + (effect.relicsDelta.warding ?? 0),
        },
      };
      return unchanged(nextVessel, `เจ้าซื้อ "${good.name}" ด้วยเงิน ${good.price} เหรียญ`);
    }

    case 'ENTER_SIGIL_ALTAR':
      return unchanged({ ...vessel, hall: 'sigilAltar' }, 'เจ้ายืนอยู่หน้าแท่นสลักตราสัญลักษณ์อันเก่าแก่');

    case 'INSCRIBE_SIGIL': {
      if (vessel.sigilPoints < SIGIL_INSCRIBE_COST) {
        return unchanged(vessel, 'แต้มสำหรับจารึกตราสัญลักษณ์ไม่เพียงพอ');
      }
      const nextSigils = inscribeSigil(vessel.sigils, omen.path);
      return unchanged(
        { ...vessel, sigils: nextSigils, sigilPoints: vessel.sigilPoints - SIGIL_INSCRIBE_COST },
        `เจ้าจารึกตราสัญลักษณ์สาย "${omen.path}" เพิ่มขึ้นอีกหนึ่งระดับ`
      );
    }

    case 'SHATTER_SIGILS': {
      const { sigils, refundedPoints } = shatterSigils(vessel.sigils);
      return unchanged(
        { ...vessel, sigils, sigilPoints: vessel.sigilPoints + refundedPoints },
        `เจ้าทุบทำลายตราสัญลักษณ์ทั้งหมด ได้แต้มคืนมา ${refundedPoints} แต้ม`
      );
    }

    case 'ENTER_RITES_BOARD':
      return unchanged({ ...vessel, hall: 'ritesBoard' }, 'เจ้าเดินมาหยุดยืนหน้าป้ายประกาศภารกิจ');

    case 'CLAIM_RITE': {
      const eligible = eligibleUnclaimedRites(vessel);
      const rite = eligible.find((candidate) => candidate.id === omen.riteId);
      if (rite === undefined) {
        return unchanged(vessel, 'ภารกิจนี้ยังไม่สำเร็จ หรือรับรางวัลไปแล้ว');
      }
      const ascendOutcome = applyAscendPoints(vessel.ascendLevel, vessel.ascendProgress, rite.rewardAscendPoints);
      const nextRites = vessel.rites.map((candidate) =>
        candidate.id === rite.id ? { ...candidate, claimed: true } : candidate
      );
      return unchanged(
        {
          ...vessel,
          rites: nextRites,
          coin: vessel.coin + rite.rewardCoin,
          ascendLevel: ascendOutcome.ascendLevel,
          ascendProgress: ascendOutcome.ascendProgress,
          sigilPoints: vessel.sigilPoints + ascendOutcome.sigilPointsGained,
        },
        `เจ้าสำเร็จภารกิจ "${rite.title}" ได้รับ ${rite.rewardCoin} เหรียญ`
      );
    }

    case 'CONSUME_MAGNIFIER': {
      if (vessel.relics.magnifier <= 0) {
        return unchanged(vessel, 'เจ้าไม่มีแว่นขยายเหลืออยู่');
      }
      const hint = drawGlyph(vessel.rngCore);
      return unchanged(
        {
          ...vessel,
          relics: { ...vessel.relics, magnifier: vessel.relics.magnifier - 1 },
          magnifierHint: hint.value,
          rngCore: hint.nextSeed,
        },
        `เจ้าส่องแว่นขยายเห็นเงาลาง ๆ ของลูกเต๋าลูกหนึ่ง: "${hint.value}"`
      );
    }

    case 'QUIT_TAVERN':
      return unchanged({ ...vessel, hall: vessel.won ? 'ascension' : 'ashes', alive: false }, 'เจ้าเดินออกจากโรงเตี๊ยมเงาราตรี...');

    default: {
      const exhaustiveCheck: never = omen;
      return unchanged(vessel, `ไม่รู้จักลางบอกเหตุนี้: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
};
