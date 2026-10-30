import type { CalculatorInput } from './calculator.js';
import { inputToQuery } from './query.js';

/**
 * Browser conveniences around the query codec. Everything here touches
 * `window`, so import it from the `fursuit-yardage-engine/browser`
 * subpath only in client-side code. All functions are guarded and no-op
 * outside a browser, so importing this module in SSR never crashes.
 */

export function hasCalculatorQuery(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).toString().length > 0;
}

/**
 * Absolute URL for a "copy link" button. `baseUrl` overrides the current
 * location - useful for embedded widgets whose copied link should land on
 * the host site instead of the iframe URL.
 */
export function shareUrlFor(input: CalculatorInput, baseUrl?: string): string {
  if (typeof window === 'undefined') return '';
  const origin = baseUrl ?? `${window.location.origin}${window.location.pathname}`;
  return `${origin}?${inputToQuery(input)}`;
}

/**
 * Keep the address bar in sync after every calculation, so the URL a user
 * copies from the omnibox always matches the numbers on screen.
 * replaceState (not push) - recalculating is not page navigation.
 */
export function syncUrlToInput(input: CalculatorInput): void {
  if (typeof window === 'undefined') return;
  const query = inputToQuery(input);
  const next = `${window.location.pathname}?${query}`;
  if (window.location.pathname + window.location.search !== next) {
    window.history.replaceState(null, '', next);
  }
}
