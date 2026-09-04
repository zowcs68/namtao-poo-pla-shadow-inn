/**
 * format.ts
 * ----------------------------------------------------------------------------
 * "เครื่องมือแต่งอักษร" — pure function ล้วน ๆ สำหรับเตรียมสตริงก่อนพิมพ์ออกจอ
 * ไม่มี console.log หรือ I/O ใด ๆ ในไฟล์นี้ — เพียงแปลงข้อความเป็นข้อความ
 * ----------------------------------------------------------------------------
 */

export const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  fgBlack: '\x1b[30m',
  fgRed: '\x1b[31m',
  fgGreen: '\x1b[32m',
  fgYellow: '\x1b[33m',
  fgBlue: '\x1b[34m',
  fgMagenta: '\x1b[35m',
  fgCyan: '\x1b[36m',
  fgWhite: '\x1b[37m',
  fgGray: '\x1b[90m',
  bgBlack: '\x1b[40m',
  bgMagentaBright: '\x1b[105m',
} as const;

export const paint = (code: string) => (text: string): string => `${code}${text}${ANSI.reset}`;

export const gold = paint(ANSI.fgYellow + ANSI.bold);
export const shadow = paint(ANSI.fgMagenta);
export const bloodRed = paint(ANSI.fgRed + ANSI.bold);
export const jade = paint(ANSI.fgGreen);
export const skyline = paint(ANSI.fgCyan);
export const whisper = paint(ANSI.fgGray + ANSI.dim);
export const title = paint(ANSI.bold + ANSI.fgMagenta);

const INNER_WIDTH = 62;

/** centerLine: จัดข้อความให้อยู่กึ่งกลางความกว้างที่กำหนด — pure (คำนวณจากความยาว "ที่มองเห็น" คร่าว ๆ) */
export const centerLine = (text: string, width: number = INNER_WIDTH): string => {
  const visibleLength = stripAnsi(text).length;
  const totalPad = Math.max(0, width - visibleLength);
  const left = Math.floor(totalPad / 2);
  const right = totalPad - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
};

/** stripAnsi: ตัดรหัสสี ANSI ออกเพื่อคำนวณความยาวข้อความจริง — pure */
export const stripAnsi = (text: string): string => text.replace(/\x1b\[[0-9;]*m/g, '');

/** padRight: เติมช่องว่างด้านขวาให้ครบความกว้างที่กำหนด (คำนึงถึงความยาวที่มองเห็นจริง) — pure */
export const padRight = (text: string, width: number): string => {
  const visibleLength = stripAnsi(text).replace(/[\u0E31\u0E34-\u0E39\u0E47-\u0E4C]/g, "").length;
  return text + ' '.repeat(Math.max(0, width - visibleLength));
};

/** frameLines: ห่อหุ้มบรรทัดข้อความหลายบรรทัดด้วยกรอบลายเส้นสวยงาม — pure */
export const frameLines = (lines: readonly string[], width: number = INNER_WIDTH): readonly string[] => {
  const top = '╔' + '═'.repeat(width + 2) + '╗';
  const bottom = '╚' + '═'.repeat(width + 2) + '╝';
  const body = lines.map((line) => `║ ${padRight(line, width)} ║`);
  return [top, ...body, bottom];
};

/** progressBar: สร้างแถบความคืบหน้าแบบข้อความ เช่น [██████░░░░] 60% — pure */
export const progressBar = (percent: number, segments: number = 20): string => {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * segments);
  return `[${'█'.repeat(filled)}${'░'.repeat(segments - filled)}] ${clamped}%`;
};

/** numbered: ติดหมายเลขนำหน้ารายการเมนู เช่น "1) เดินไปตลาด" — pure */
export const numbered = (index: number, text: string): string => `${index}) ${text}`;
