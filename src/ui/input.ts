/**
 * input.ts
 * ----------------------------------------------------------------------------
 * "ประสาทสัมผัสของผู้เล่น" — ชั้น IO เดียวที่อ่านแป้นพิมพ์จริง (IMPURE)
 * รองรับทั้งการกดลูกศร (ขึ้น/ลง) + Enter เพื่อไฮไลต์เลือกเมนู
 * และการกดคีย์ลัด (ตัวเลข/ตัวอักษร) เพื่อเลือกทันทีโดยไม่ต้องไล่ไฮไลต์
 * ----------------------------------------------------------------------------
 */

import * as readline from 'readline';
import { MenuEntry } from './screens';

/**
 * captureMenuChoice: รอรับการกดแป้นพิมพ์หนึ่งครั้งแล้วคืน MenuEntry ที่ถูกเลือก
 * onHighlightChange จะถูกเรียกทุกครั้งที่ผู้เล่นเลื่อนไฮไลต์ด้วยลูกศร เพื่อให้ผู้เรียก re-render จอ
 */
export const captureMenuChoice = (
  menu: readonly MenuEntry[],
  initialHighlight: number,
  onHighlightChange: (nextHighlight: number) => void
): Promise<MenuEntry> =>
  new Promise((resolve) => {
    if (menu.length === 0) {
      throw new Error('input: ไม่มีตัวเลือกเมนูให้เลือกเลย');
    }

    let highlight = initialHighlight;
    readline.emitKeypressEvents(process.stdin);
    const wasRaw = process.stdin.isTTY ? process.stdin.isRaw : false;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();

    const cleanup = (): void => {
      process.stdin.removeListener('keypress', onKeypress);
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(wasRaw);
      }
    };

    const findByHotkey = (rawKey: string): MenuEntry | undefined => {
      const normalized = rawKey.toLowerCase();
      return menu.find((entry) => entry.hotkey.toLowerCase() === normalized);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onKeypress = (rawStr: string, key: any): void => {
      // Ctrl+C ยังคงออกจากโปรแกรมได้เสมอเพื่อความปลอดภัยของผู้เล่น
      if (key && key.ctrl && key.name === 'c') {
        cleanup();
        process.stdout.write('\n');
        process.exit(0);
      }

      if (key && key.name === 'up') {
        highlight = (highlight - 1 + menu.length) % menu.length;
        onHighlightChange(highlight);
        return;
      }
      if (key && key.name === 'down') {
        highlight = (highlight + 1) % menu.length;
        onHighlightChange(highlight);
        return;
      }
      if (key && (key.name === 'return' || key.name === 'enter')) {
        const chosen = menu[highlight];
        if (chosen !== undefined) {
          cleanup();
          resolve(chosen);
        }
        return;
      }
      if (typeof rawStr === 'string' && rawStr.length > 0) {
        const direct = findByHotkey(rawStr);
        if (direct !== undefined) {
          cleanup();
          resolve(direct);
        }
      }
    };

    process.stdin.on('keypress', onKeypress);
  });

/**
 * captureAmount: ถามจำนวนเงินแบบพิมพ์ตัวเลขจริง (สลับออกจาก raw mode ชั่วคราว)
 * คืนค่า null หากผู้เล่นพิมพ์ยกเลิก (เว้นว่างหรือพิมพ์ 'c')
 */
export const captureAmount = (promptText: string, maxAmount: number): Promise<number | null> =>
  new Promise((resolve) => {
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const ask = (): void => {
      rl.question(promptText, (answer) => {
        const trimmed = answer.trim().toLowerCase();
        if (trimmed === '' || trimmed === 'c') {
          rl.close();
          resolve(null);
          return;
        }
        const parsed = Number.parseInt(trimmed, 10);
        if (Number.isNaN(parsed) || parsed <= 0 || parsed > maxAmount) {
          process.stdout.write(`กรุณาใส่ตัวเลขระหว่าง 1 ถึง ${maxAmount} (หรือเว้นว่างเพื่อยกเลิก)\n`);
          ask();
          return;
        }
        rl.close();
        resolve(parsed);
      });
    };

    ask();
  });
