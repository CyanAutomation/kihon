const REFERENCE = /^\{[^{}]+\}$/;

export function isTokenReference(value: unknown): value is string {
  return typeof value === 'string' && REFERENCE.test(value);
}
