import type { CalculationResult, CalculatorInput, PartId } from './calculator.js';
import { FUR_WIDTHS, usableWidthYd } from './calculator.js';

/** One body region laid out along the bolt. */
export interface LayoutPiece {
  id: PartId;
  label: string;
  /** Length along the bolt: area / usable width, exactly as the engine computes it. */
  yards: number;
}

/**
 * Pure geometry for a simplified cut-layout diagram.
 *
 * This is NOT a nesting solver. Each body region is one rectangle whose length
 * along the bolt is exactly what the engine computed: area / usable width.
 * Stacked in order the pieces reproduce the base yardage, and the allowance
 * band makes the total match "yards to buy". Real pattern pieces nest
 * differently - renderers should say so.
 */
export interface CutLayout {
  /** Usable bolt width in yards (selvedge removed, nap discounted). */
  usableWidthYd: number;
  pieces: LayoutPiece[];
  /** totalYards - baseYards, never negative: the allowance band. */
  allowanceYards: number;
  /** convenience: sum of pieces + allowanceYards, ≈ totalYards. */
  totalWithAllowances: number;
}

export function computeCutLayout(input: CalculatorInput, result: CalculationResult): CutLayout | null {
  const width = FUR_WIDTHS.find((w) => w.id === input.furWidthId) ?? FUR_WIDTHS[1];
  const napFactor = result.allowances.napFactor || 1;
  const usable = usableWidthYd(width.inches, napFactor);

  const covered = result.parts.filter((p) => p.covered && p.areaSqYd > 0);
  if (covered.length === 0 || result.totalYards <= 0) return null;

  const pieces = covered.map((part) => ({
    id: part.id,
    label: part.label,
    yards: part.areaSqYd / usable,
  }));

  const allowanceYards = Math.max(result.totalYards - result.baseYards, 0);

  return {
    usableWidthYd: usable,
    pieces,
    allowanceYards,
    totalWithAllowances: pieces.reduce((s, p) => s + p.yards, 0) + allowanceYards,
  };
}
