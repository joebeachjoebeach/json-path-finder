export function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function debounce<T>(
  callback: (...args: T[]) => unknown,
  delay: number,
): (...args: T[]) => unknown {
  let timeout: number;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), delay);
  };
}
