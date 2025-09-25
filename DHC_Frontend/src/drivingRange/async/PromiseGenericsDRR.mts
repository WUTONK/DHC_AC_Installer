async function maybeRun<T>(ok: boolean, value: T): Promise<T | undefined> {
  if (!ok) return undefined;
  return value;
}

let r1: number | undefined;
let r2: number | undefined;

try{
  r1 = await maybeRun(true, 123);   // r1: number | undefined，实际为 123
  r2 = await maybeRun(false, 123);
} finally{
  console.log(r1)
  console.log(r2)
}



