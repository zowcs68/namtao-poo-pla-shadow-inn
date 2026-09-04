/**
 * main.ts
 * ----------------------------------------------------------------------------
 * "จุดเริ่มต้นของการเดินทาง" — ไฟล์เดียวที่ประกอบทุกอย่างเข้าด้วยกันและรัน I/O loop
 * โครงสร้าง flow: gate -> courtyard -> wagerRoom -> ordealResult -> bazaar/sigilAltar/ritesBoard
 *                 -> (courtyard อีกครั้ง) -> ... -> ashes/ascension
 *
 * รูปแบบการทำงานในลูปหลัก (คล้าย Redux/Elm architecture):
 *   1. renderCurrentHall(vessel) + menuForCurrentHall(vessel)  --(pure)--> เนื้อหาที่จะพิมพ์
 *   2. lantern.renderFrame(...)                                --(impure)--> พิมพ์ออกจอ
 *   3. input.captureMenuChoice(...)                            --(impure)--> รอผู้เล่นกด
 *   4. แปลงตัวเลือกเป็น Omen แล้วส่งเข้า weaveFate(vessel, omen) --(pure)--> vessel ใหม่ + echoes
 *   5. scribe.inscribeToChronicle(echoes)                      --(impure)--> บันทึกลง log ไฟล์
 *   6. วนกลับไปข้อ 1
 * ----------------------------------------------------------------------------
 */

import { freshSeedFromClock } from './game/oracle';
import { spawnVessel } from './state/genesis';
import { weaveFate } from './state/fateWeaver';
import { menuForCurrentHall, renderCurrentHall, renderMenuLines, MenuEntry } from './ui/screens';
import { captureAmount, captureMenuChoice } from './ui/input';
import { renderFrame, beep } from './ui/lantern';
import { inscribeToChronicle, logPathForDisplay } from './utils/scribe';
import { Omen, Vessel } from './types/mythos';

/** composeFrame: ประกอบเนื้อหาฉาก + เมนู (พร้อมไฮไลต์) เป็นบรรทัดเดียวสำหรับพิมพ์ — pure */
const composeFrame = (vessel: Vessel, menu: readonly MenuEntry[], highlight: number): readonly string[] => [
  ...renderCurrentHall(vessel),
  '',
  ...renderMenuLines(menu, highlight),
  '',
  vessel.hall !== 'gate' ? `(ใช้ลูกศร ↑/↓ + Enter หรือกดคีย์ลัดในวงเล็บได้โดยตรง | บันทึกที่ ${logPathForDisplay()})` : '',
];

/** waitForChoice: แสดงจอแล้วรอผู้เล่นเลือกเมนู พร้อมรองรับการรีวาดเมื่อไฮไลต์เปลี่ยน */
const waitForChoice = async (vessel: Vessel): Promise<MenuEntry> => {
  const menu = menuForCurrentHall(vessel);
  let highlight = 0;
  renderFrame(composeFrame(vessel, menu, highlight));
  return captureMenuChoice(menu, highlight, (nextHighlight) => {
    highlight = nextHighlight;
    renderFrame(composeFrame(vessel, menu, highlight));
  });
};

/** dispatch: ส่ง Omen เข้า reducer แล้วบันทึกผลลัพธ์ลง log — จุดเดียวที่เชื่อม pure core กับ scribe (impure) */
const dispatch = (vessel: Vessel, omen: Omen): Vessel => {
  const result = weaveFate(vessel, omen);
  inscribeToChronicle(result.echoes);
  return result.vessel;
};

const farewellAndExit = (): never => {
  renderFrame(['', '  ขอบคุณที่แวะมาเยือนโรงเตี๊ยมเงาราตรี แล้วพบกันใหม่...', '']);
  process.exit(0);
};

async function mainLoop(): Promise<void> {
  let vessel = spawnVessel(freshSeedFromClock());

  for (;;) {
    const chosen = await waitForChoice(vessel);

    if (chosen.action.kind === 'restartProgram') {
      farewellAndExit();
    }

    if (chosen.action.kind === 'omen' && chosen.action.omen.type === 'QUIT_TAVERN') {
      farewellAndExit();
    }

    if (chosen.action.kind === 'omen') {
      const beforeHearts = vessel.hearts;
      vessel = dispatch(vessel, chosen.action.omen);
      if (vessel.hearts < beforeHearts) {
        beep();
      }
      continue;
    }

    if (chosen.action.kind === 'chooseGlyph') {
      const amount = await captureAmount(
        `จำนวนเดิมพัน (สูงสุด ${vessel.coin} เหรียญ, เว้นว่างเพื่อยกเลิก): `,
        vessel.coin
      );
      if (amount !== null) {
        vessel = dispatch(vessel, { type: 'RAISE_WAGER', glyph: chosen.action.glyph, amount });
      }
      continue;
    }
  }
}

mainLoop().catch((error: unknown) => {
  process.stderr.write(`เกิดข้อผิดพลาดที่ไม่คาดคิดในโรงเตี๊ยมเงาราตรี: ${String(error)}\n`);
  process.exit(1);
});
