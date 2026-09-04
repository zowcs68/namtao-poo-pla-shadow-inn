/**
 * lantern.ts
 * ----------------------------------------------------------------------------
 * "โคมไฟส่องจอ" — ชั้น IO สำหรับการแสดงผลบนจอเทอร์มินัลเท่านั้น (IMPURE)
 * รับ "ข้อความที่ประกอบเสร็จแล้ว" (string[]) จาก screens.ts (pure) มาพิมพ์ออกจอ
 * ไฟล์นี้ไม่มี logic เกมใด ๆ ทั้งสิ้น มีหน้าที่แค่พิมพ์และเคลียร์จอ
 * ----------------------------------------------------------------------------
 */

/** clearScreen: SIDE EFFECT — ล้างจอเทอร์มินัล */
export const clearScreen = (): void => {
  process.stdout.write('\x1Bc');
};

/** render: SIDE EFFECT — พิมพ์บรรทัดทั้งหมดออกจอ (ไม่มีการตัดสินใจใด ๆ ในนี้) */
export const render = (lines: readonly string[]): void => {
  process.stdout.write(lines.join('\n') + '\n');
};

/** renderFrame: SIDE EFFECT — ล้างจอแล้วพิมพ์เนื้อหาใหม่ทั้งหมด (ใช้เรียกทุกครั้งที่เปลี่ยนฉาก) */
export const renderFrame = (lines: readonly string[]): void => {
  clearScreen();
  render(lines);
};

/** beep: SIDE EFFECT เล็ก ๆ — ส่งเสียงเตือนของเทอร์มินัลเมื่อเกิดเหตุการณ์สำคัญ */
export const beep = (): void => {
  process.stdout.write('\x07');
};
