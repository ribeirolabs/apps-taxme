export function omit<T, K extends keyof T = keyof T>(
  item: T,
  toOmit: K[]
): Omit<T, K> {
  const next = { ...item };

  for (const key of toOmit) {
    delete next[key];
  }

  return next;
}
