/**
 * scribe.ts
 * ----------------------------------------------------------------------------
 * "อาลักษณ์แห่งโรงเตี๊ยม" — จุดเดียวในโปรเจกต์ที่เขียนไฟล์ log ลงดิสก์ (IMPURE)
 * แยกออกจาก logic เกมทั้งหมดโดยเจตนา เพื่อให้ pure core ไม่ถูกปนเปื้อนด้วย I/O
 * ----------------------------------------------------------------------------
 */

import * as fs from 'fs';
import * as path from 'path';

const LOG_PATH = path.join(process.cwd(), 'tavern-chronicle.log');

/** timestamp: จุด impure เล็ก ๆ ที่แตะนาฬิกาเครื่อง เพื่อประทับเวลาในบันทึก */
const timestamp = (): string => new Date().toISOString();

/**
 * inscribeToChronicle: SIDE EFFECT — ต่อท้ายข้อความบรรยายเหตุการณ์ลงไฟล์ log บนดิสก์
 * ฟังก์ชันนี้ไม่คืนค่าอะไรที่มีความหมายต่อ state ของเกม (มีไว้เพื่อบันทึกประวัติเท่านั้น)
 */
export const inscribeToChronicle = (echoes: readonly string[]): void => {
  if (echoes.length === 0) {
    return;
  }
  const lines = echoes.map((echo) => `[${timestamp()}] ${echo}`).join('\n') + '\n';
  try {
    fs.appendFileSync(LOG_PATH, lines, { encoding: 'utf-8' });
  } catch {
    // การเขียน log ล้มเหลวไม่ควรทำให้เกมล่ม — เพียงข้ามไปเงียบ ๆ
  }
};

/** logPathForDisplay: ให้ UI แสดง path ของไฟล์บันทึกให้ผู้เล่นทราบได้ */
export const logPathForDisplay = (): string => LOG_PATH;
