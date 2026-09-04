/**
 * screens.ts
 * ----------------------------------------------------------------------------
 * "ผู้ประกอบฉาก" — pure function ที่แปลง Vessel เป็น (1) บรรทัดข้อความสำหรับแสดงผล
 * และ (2) รายการเมนูที่กดได้ในฉากนั้น ๆ ไฟล์นี้ไม่พิมพ์อะไรออกจอเอง (นั่นคือหน้าที่ของ lantern.ts)
 * ----------------------------------------------------------------------------
 */

import { bazaarGoods } from '../game/bazaar';
import { eligibleUnclaimedRites } from '../game/rites';
import { activeSigilSummary, ascendProgressPercent, heartsDisplay, relicSummary, satietyPercent } from '../state/gaze';
import {
  ANSI, bloodRed, centerLine, frameLines, gold, jade, paint, progressBar, shadow, skyline, title, whisper,
} from '../utils/format';
import { Glyph, Omen, SigilPath, Vessel } from '../types/mythos';

const glyphLabel: Record<Glyph, string> = {
  gourd: '🍐 น้ำเต้า',
  crab: '🦀 ปู',
  fish: '🐟 ปลา',
  rooster: '🐓 ไก่',
  shrimp: '🦐 กุ้ง',
  tiger: '🐯 เสือ',
};

export type MenuAction =
  | { readonly kind: 'omen'; readonly omen: Omen }
  | { readonly kind: 'chooseGlyph'; readonly glyph: Glyph }
  | { readonly kind: 'restartProgram' };

export interface MenuEntry {
  readonly hotkey: string;
  readonly label: string;
  readonly action: MenuAction;
}

/** statusHeader: แผงสถานะผู้เล่นที่แสดงอยู่ทุกฉาก (ยกเว้นหน้าประตูและฉากจบ) — pure */
const statusHeader = (vessel: Vessel): readonly string[] =>
  frameLines([
    `${gold('เหรียญ')} ${vessel.coin}   ${skyline('เลเวล')} ${vessel.ascendLevel}/30 ${progressBar(ascendProgressPercent(vessel), 12)}`,
    `${bloodRed('หัวใจ')} ${heartsDisplay(vessel)}   ${jade('ความอิ่ม')} ${progressBar(satietyPercent(vessel), 12)}`,
    `${shadow('แต้มจารึก')} ${vessel.sigilPoints}   ${activeSigilSummary(vessel)}`,
    `${paint(ANSI.fgCyan)(relicSummary(vessel))}`,
  ]);

const narrativeBlock = (vessel: Vessel): readonly string[] =>
  vessel.chronicle.length > 0 ? [...vessel.chronicle.map((line) => whisper('» ' + line)), ''] : [''];

/**
 * renderMenuLines: แปลงรายการเมนูเป็นบรรทัดข้อความ พร้อมไฮไลต์ตัวเลือกที่ถูกชี้อยู่ (จากการกดลูกศร)
 * highlightIndex เป็น -1 เมื่อไม่ต้องการไฮไลต์ (เช่นตอนใช้แค่คีย์ลัดพิมพ์ตรง ๆ)
 */
export const renderMenuLines = (menu: readonly MenuEntry[], highlightIndex: number = -1): readonly string[] =>
  menu.map((entry, i) => {
    const pointer = i === highlightIndex ? gold('▶ ') : '  ';
    const key = i === highlightIndex ? paint(ANSI.underline)(gold(entry.hotkey)) : gold(entry.hotkey);
    return `${pointer}[${key}] ${entry.label}`;
  });

// ---------------------------------------------------------------------------
// GATE (title screen)
// ---------------------------------------------------------------------------

export const renderGate = (): readonly string[] => [
  '',
  centerLine(title('~ โรงเตี๊ยมเงาราตรี ~')),
  centerLine(shadow('น้ำเต้า ปู ปลา แห่งเจ้ามือเงา')),
  '',
  ...frameLines([
    'ณ สุดขอบเมือง มีโรงเตี๊ยมหลังหนึ่งเปิดไฟระยิบระยับทุกคืนจันทร์ดับ',
    'ผู้คนเล่าลือว่าใครก็ตามที่ก้าวเข้าไป จะได้ดวลดวงชะตากับ',
    '"เจ้ามือเงา" ผู้ไม่เคยแพ้ใครมาก่อน... จนกระทั่งวันนี้',
    '',
    'จงพิสูจน์ตนด้วยลูกเต๋าน้ำเต้าปูปลา ไต่บันไดจิตวิญญาณให้ถึงเลเวล 30',
    'ก่อนที่เงินในกระเป๋าหรือหัวใจของเจ้าจะหมดลงเสียก่อน',
  ]),
  '',
];

export const gateMenu = (): readonly MenuEntry[] => [
  { hotkey: 'Enter', label: 'เข้าสู่โรงเตี๊ยม', action: { kind: 'omen', omen: { type: 'STEP_INTO_COURTYARD' } } },
];

// ---------------------------------------------------------------------------
// COURTYARD (main menu)
// ---------------------------------------------------------------------------

export const courtyardMenu = (vessel: Vessel): readonly MenuEntry[] => {
  const claimable = eligibleUnclaimedRites(vessel).length;
  return [
    { hotkey: '1', label: 'ไปห้องวางเดิมพัน (ดวลกับเจ้ามือเงา)', action: { kind: 'omen', omen: { type: 'ENTER_WAGER_ROOM' } } },
    { hotkey: '2', label: 'ไปตลาดเร้นลับ (ซื้อของ)', action: { kind: 'omen', omen: { type: 'ENTER_BAZAAR' } } },
    { hotkey: '3', label: 'ไปแท่นสลักตราสัญลักษณ์ (อัปเกรด)', action: { kind: 'omen', omen: { type: 'ENTER_SIGIL_ALTAR' } } },
    {
      hotkey: '4',
      label: `ไปป้ายภารกิจ${claimable > 0 ? gold(`  (มี ${claimable} ภารกิจพร้อมรับรางวัล!)`) : ''}`,
      action: { kind: 'omen', omen: { type: 'ENTER_RITES_BOARD' } },
    },
    { hotkey: 'q', label: 'ออกจากโรงเตี๊ยม (จบการเล่น)', action: { kind: 'omen', omen: { type: 'QUIT_TAVERN' } } },
  ];
};

export const renderCourtyard = (vessel: Vessel): readonly string[] => [
  centerLine(title('ลานกลางโรงเตี๊ยม')),
  ...statusHeader(vessel),
  ...narrativeBlock(vessel),
];

// ---------------------------------------------------------------------------
// WAGER ROOM
// ---------------------------------------------------------------------------

export const wagerRoomMenu = (vessel: Vessel): readonly MenuEntry[] => {
  const glyphOptions: MenuEntry[] = (['gourd', 'crab', 'fish', 'rooster', 'shrimp', 'tiger'] as const).map(
    (glyph, i) => ({
      hotkey: String(i + 1),
      label: `เลือกสัญลักษณ์ ${glyphLabel[glyph]}${vessel.magnifierHint === glyph ? gold('  ★ แว่นขยายบอกใบ้ไว้!') : ''}`,
      action: { kind: 'chooseGlyph', glyph },
    })
  );
  const extra: MenuEntry[] = [];
  if (vessel.relics.magnifier > 0 && vessel.magnifierHint === null) {
    extra.push({ hotkey: 'm', label: 'ใช้แว่นขยาย (ส่องเงาลูกเต๋าล่วงหน้า)', action: { kind: 'omen', omen: { type: 'CONSUME_MAGNIFIER' } } });
  }
  if (vessel.pendingWager !== null) {
    extra.push({ hotkey: 'f', label: gold('เผชิญหน้ากับเจ้ามือเงา! (ทอยลูกเต๋า)'), action: { kind: 'omen', omen: { type: 'FACE_THE_DEALER' } } });
  }
  extra.push({ hotkey: 'r', label: 'ถอยกลับสู่ลานกลาง', action: { kind: 'omen', omen: { type: 'RETREAT_TO_COURTYARD' } } });
  return [...glyphOptions, ...extra];
};

export const renderWagerRoom = (vessel: Vessel): readonly string[] => [
  centerLine(title('ห้องวางเดิมพัน')),
  ...statusHeader(vessel),
  ...narrativeBlock(vessel),
  vessel.pendingWager
    ? shadow(`เดิมพันปัจจุบัน: ${vessel.pendingWager.amount} เหรียญ บนสัญลักษณ์ ${glyphLabel[vessel.pendingWager.glyph]}`)
    : whisper('ยังไม่มีเดิมพัน — เลือกสัญลักษณ์ที่เจ้าเชื่อมั่น'),
  '',
];

// ---------------------------------------------------------------------------
// ORDEAL RESULT
// ---------------------------------------------------------------------------

export const ordealResultMenu = (): readonly MenuEntry[] => [
  { hotkey: 'Enter', label: 'กลับสู่ลานกลาง', action: { kind: 'omen', omen: { type: 'RETREAT_TO_COURTYARD' } } },
];

export const renderOrdealResult = (vessel: Vessel): readonly string[] => [
  centerLine(title('ผลการดวล')),
  ...statusHeader(vessel),
  vessel.lastDice ? centerLine(skyline(vessel.lastDice.map((g) => glyphLabel[g]).join('   '))) : '',
  '',
  ...narrativeBlock(vessel),
];

// ---------------------------------------------------------------------------
// BAZAAR
// ---------------------------------------------------------------------------

export const bazaarMenu = (): readonly MenuEntry[] => [
  ...bazaarGoods.map((good, i) => ({
    hotkey: String(i + 1),
    label: `${good.name} — ${good.price} เหรียญ (${good.lore})`,
    action: { kind: 'omen' as const, omen: { type: 'PURCHASE_GOOD' as const, goodId: good.id } },
  })),
  { hotkey: 'r', label: 'ถอยกลับสู่ลานกลาง', action: { kind: 'omen', omen: { type: 'RETREAT_TO_COURTYARD' } } },
];

export const renderBazaar = (vessel: Vessel): readonly string[] => [
  centerLine(title('ตลาดเร้นลับ')),
  ...statusHeader(vessel),
  ...narrativeBlock(vessel),
];

// ---------------------------------------------------------------------------
// SIGIL ALTAR
// ---------------------------------------------------------------------------

const sigilPathLabel: Record<SigilPath, string> = {
  coinfavor: 'สายเพิ่มรางวัล (coinfavor)',
  lossward: 'สายกันขาดทุน (lossward)',
  ascendrite: 'สายเร่งเลเวล (ascendrite)',
};

export const sigilAltarMenu = (): readonly MenuEntry[] => [
  { hotkey: '1', label: `จารึก ${sigilPathLabel.coinfavor} (-1 แต้ม)`, action: { kind: 'omen', omen: { type: 'INSCRIBE_SIGIL', path: 'coinfavor' } } },
  { hotkey: '2', label: `จารึก ${sigilPathLabel.lossward} (-1 แต้ม)`, action: { kind: 'omen', omen: { type: 'INSCRIBE_SIGIL', path: 'lossward' } } },
  { hotkey: '3', label: `จารึก ${sigilPathLabel.ascendrite} (-1 แต้ม)`, action: { kind: 'omen', omen: { type: 'INSCRIBE_SIGIL', path: 'ascendrite' } } },
  { hotkey: 's', label: bloodRed('ทุบทำลายตราสัญลักษณ์ทั้งหมด (คืนแต้มครึ่งหนึ่ง)'), action: { kind: 'omen', omen: { type: 'SHATTER_SIGILS' } } },
  { hotkey: 'r', label: 'ถอยกลับสู่ลานกลาง', action: { kind: 'omen', omen: { type: 'RETREAT_TO_COURTYARD' } } },
];

export const renderSigilAltar = (vessel: Vessel): readonly string[] => [
  centerLine(title('แท่นสลักตราสัญลักษณ์')),
  ...statusHeader(vessel),
  ...narrativeBlock(vessel),
];

// ---------------------------------------------------------------------------
// RITES BOARD
// ---------------------------------------------------------------------------

export const ritesBoardMenu = (vessel: Vessel): readonly MenuEntry[] => {
  const eligible = eligibleUnclaimedRites(vessel);
  const claimEntries: MenuEntry[] = eligible.map((rite, i) => ({
    hotkey: String(i + 1),
    label: gold(`รับรางวัลภารกิจ: ${rite.title} (+${rite.rewardCoin} เหรียญ)`),
    action: { kind: 'omen', omen: { type: 'CLAIM_RITE', riteId: rite.id } },
  }));
  return [...claimEntries, { hotkey: 'r', label: 'ถอยกลับสู่ลานกลาง', action: { kind: 'omen', omen: { type: 'RETREAT_TO_COURTYARD' } } }];
};

export const renderRitesBoard = (vessel: Vessel): readonly string[] => {
  const listLines = vessel.rites.map((rite) => {
    const mark = rite.claimed ? jade('[สำเร็จแล้ว]') : whisper('[ยังไม่สำเร็จ]');
    return `${mark} ${rite.title} — ${rite.lore}`;
  });
  return [
    centerLine(title('ป้ายประกาศภารกิจ')),
    ...statusHeader(vessel),
    '',
    ...listLines,
    '',
  ];
};

// ---------------------------------------------------------------------------
// ASHES (defeat) / ASCENSION (victory)
// ---------------------------------------------------------------------------

export const endingMenu = (): readonly MenuEntry[] => [
  { hotkey: 'Enter', label: 'ปิดโปรแกรม', action: { kind: 'restartProgram' } },
];

export const renderAshes = (vessel: Vessel): readonly string[] => [
  '',
  centerLine(bloodRed('~ เถ้าถ่านแห่งเงาราตรี ~')),
  '',
  ...frameLines([
    'เจ้ามือเงายิ้มอย่างเยือกเย็น เมื่อเห็นเจ้าล้มลงกับพื้นไม้เก่าของโรงเตี๊ยม',
    `เจ้าไปได้ถึงเลเวล ${vessel.ascendLevel} และผ่านมาแล้ว ${vessel.tavernNightsSurvived} ดวล`,
    '',
    'หากต้องการลองใหม่ โปรดรันโปรแกรมนี้อีกครั้ง',
  ]),
  '',
];

export const renderAscension = (vessel: Vessel): readonly string[] => [
  '',
  centerLine(gold('~ การไต่สู่จุดสูงสุด ~')),
  '',
  ...frameLines([
    'แสงทองสาดส่องทั่วโรงเตี๊ยม เจ้ามือเงาก้มศีรษะให้เจ้าเป็นครั้งแรกในรอบหลายศตวรรษ',
    `เจ้าไต่จิตวิญญาณถึงเลเวลสูงสุด 30 ด้วยเงิน ${vessel.coin} เหรียญติดตัว`,
    '',
    'เจ้าคือผู้พิชิตโรงเตี๊ยมเงาราตรีอย่างแท้จริง',
  ]),
  '',
];

// ---------------------------------------------------------------------------
// DISPATCH TABLE
// ---------------------------------------------------------------------------

export const renderCurrentHall = (vessel: Vessel): readonly string[] => {
  switch (vessel.hall) {
    case 'gate':
      return renderGate();
    case 'courtyard':
      return renderCourtyard(vessel);
    case 'wagerRoom':
      return renderWagerRoom(vessel);
    case 'ordealResult':
      return renderOrdealResult(vessel);
    case 'bazaar':
      return renderBazaar(vessel);
    case 'sigilAltar':
      return renderSigilAltar(vessel);
    case 'ritesBoard':
      return renderRitesBoard(vessel);
    case 'ashes':
      return renderAshes(vessel);
    case 'ascension':
      return renderAscension(vessel);
    default: {
      const exhaustiveCheck: never = vessel.hall;
      return [String(exhaustiveCheck)];
    }
  }
};

export const menuForCurrentHall = (vessel: Vessel): readonly MenuEntry[] => {
  switch (vessel.hall) {
    case 'gate':
      return gateMenu();
    case 'courtyard':
      return courtyardMenu(vessel);
    case 'wagerRoom':
      return wagerRoomMenu(vessel);
    case 'ordealResult':
      return ordealResultMenu();
    case 'bazaar':
      return bazaarMenu();
    case 'sigilAltar':
      return sigilAltarMenu();
    case 'ritesBoard':
      return ritesBoardMenu(vessel);
    case 'ashes':
    case 'ascension':
      return endingMenu();
    default: {
      const exhaustiveCheck: never = vessel.hall;
      return exhaustiveCheck;
    }
  }
};
