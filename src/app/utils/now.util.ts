export function getNow(): Date {
  const emulated = process.env.NEXT_PUBLIC_EMULATED_NOW;
  return emulated ? new Date(emulated) : new Date();
}
