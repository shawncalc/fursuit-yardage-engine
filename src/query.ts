import {
  BODY_SIZES,
  FUR_QUALITIES,
  FUR_WIDTHS,
  SUIT_TYPES,
  MAX_BUFFER_PERCENT,
  MAX_COLOR_COUNT,
  type CalculatorInput,
} from './calculator.js';

/**
 * Shareable links: the calculator state is encoded into a URL query so a
 * maker can paste "is 15 yards enough for my size?" into a forum thread and
 * everyone who clicks lands on the exact same numbers.
 *
 * Short keys keep URLs tolerable in plain-text posts:
 *   ?t=full-digitigrade&b=average&q=standard&w=w60&p=15&c=3
 * `lt` (large tail) and `cm` (complex markings) only appear when true.
 *
 * These two functions are environment-agnostic: `URLSearchParams` is a
 * WHATWG global available in Node 10+, browsers and workers.
 */

export function inputToQuery(input: CalculatorInput): string {
  const params = new URLSearchParams();
  params.set('t', input.suitType);
  params.set('b', input.bodySize);
  params.set('q', input.furQuality);
  params.set('w', input.furWidthId);
  params.set('p', String(input.bufferPercent));
  params.set('c', String(input.colorCount));
  if (input.largeTail) params.set('lt', '1');
  if (input.complexMarkings) params.set('cm', '1');
  return params.toString();
}

/**
 * Read calculator state back out of a query string. Every value is validated
 * against the real option lists, so a hand-edited or truncated URL can never
 * smuggle an invalid state into the engine - anything unknown falls back to
 * the given default.
 */
export function applyQueryToInput(query: URLSearchParams, fallback: CalculatorInput): CalculatorInput {
  const suitType = SUIT_TYPES.some((s) => s.id === query.get('t'))
    ? (query.get('t') as CalculatorInput['suitType'])
    : fallback.suitType;
  const bodySize = BODY_SIZES.some((b) => b.id === query.get('b'))
    ? (query.get('b') as CalculatorInput['bodySize'])
    : fallback.bodySize;
  const furQuality = FUR_QUALITIES.some((q) => q.id === query.get('q'))
    ? (query.get('q') as CalculatorInput['furQuality'])
    : fallback.furQuality;
  const furWidthId = FUR_WIDTHS.some((w) => w.id === query.get('w'))
    ? (query.get('w') as CalculatorInput['furWidthId'])
    : fallback.furWidthId;

  const num = (key: string, min: number, max: number, dflt: number): number => {
    const raw = Number(query.get(key));
    return Number.isFinite(raw) && raw >= min && raw <= max ? Math.round(raw) : dflt;
  };

  return {
    suitType,
    bodySize,
    furQuality,
    furWidthId,
    bufferPercent: num('p', 0, MAX_BUFFER_PERCENT, fallback.bufferPercent),
    colorCount: num('c', 1, MAX_COLOR_COUNT, fallback.colorCount),
    largeTail: query.get('lt') === '1',
    complexMarkings: query.get('cm') === '1',
  };
}
