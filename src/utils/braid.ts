/**
 * braid.ts
 * ----------------------------------------------------------------------------
 * "การถักทอฟังก์ชัน" — เครื่องมือ compose/pipe ที่เขียนเอง ไม่พึ่งไลบรารีภายนอก
 * ทุกฟังก์ชันในไฟล์นี้เป็น pure function 100%
 * ----------------------------------------------------------------------------
 */

/** thread: เดิน "ด้าย" ของค่า a ผ่านลำดับฟังก์ชัน f1, f2, ... ไปทีละเส้น (คือ pipe) */
export function thread<A, B>(a: A, f1: (a: A) => B): B;
export function thread<A, B, C>(a: A, f1: (a: A) => B, f2: (b: B) => C): C;
export function thread<A, B, C, D>(
  a: A,
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D
): D;
export function thread<A, B, C, D, E>(
  a: A,
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E
): E;
export function thread<A, B, C, D, E, F>(
  a: A,
  f1: (a: A) => B,
  f2: (b: B) => C,
  f3: (c: C) => D,
  f4: (d: D) => E,
  f5: (e: E) => F
): F;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function thread(a: unknown, ...fns: Array<(x: unknown) => unknown>): unknown {
  return fns.reduce((value, fn) => fn(value), a);
}

/** weave: ประกอบฟังก์ชันหลายตัวเข้าด้วยกันเป็นฟังก์ชันเดียว (คือ compose แบบขวาไปซ้าย) */
export function weave<A, B, C>(f2: (b: B) => C, f1: (a: A) => B): (a: A) => C {
  return (a: A) => f2(f1(a));
}

/** weaveAll: ประกอบฟังก์ชันชนิดเดียวกัน (A -> A) หลายตัวเรียงจากซ้ายไปขวาให้เป็นเส้นด้ายเดียว */
export function weaveAll<A>(...fns: ReadonlyArray<(a: A) => A>): (a: A) => A {
  return (a: A) => fns.reduce((value, fn) => fn(value), a);
}

/** whenTrue: higher-order function — ใช้ทรานส์ฟอร์มค่าเฉพาะเมื่อเงื่อนไขเป็นจริง ไม่งั้นคืนค่าเดิม */
export function whenTrue<A>(predicate: (a: A) => boolean, fn: (a: A) => A): (a: A) => A {
  return (a: A) => (predicate(a) ? fn(a) : a);
}

/** tapEcho: แทรกฟังก์ชันสังเกตการณ์ระหว่างทาง โดยไม่เปลี่ยนค่าที่ไหลผ่าน (ใช้ debug/log ได้แบบ pure-friendly) */
export function tapEcho<A>(observe: (a: A) => void): (a: A) => A {
  return (a: A) => {
    observe(a);
    return a;
  };
}
