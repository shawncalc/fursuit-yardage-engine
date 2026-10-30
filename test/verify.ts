/**
 * Invariant tests for the yardage engine. Run with:
 *   npm test
 *
 * These are property tests, not unit tests: they sweep the whole input space
 * and assert relationships that must hold for every combination, then run
 * targeted semantic checks. They run against the BUILT package in dist/, so
 * what gets tested is exactly what npm publishes.
 */

import {
  BODY_SIZES,
  FUR_QUALITIES,
  FUR_WIDTHS,
  SUIT_TYPES,
  calculateYardage,
  formatResultAsText,
  usableWidthYd,
  type CalculatorInput,
  computeCutLayout,
  applyQueryToInput,
  inputToQuery,
} from '../dist/index.js';

let failures = 0;
let checks = 0;

function check(condition: boolean, label: string) {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.log(`  FAIL  ${label}`);
  }
}

function approx(a: number, b: number, tol = 0.02) {
  return Math.abs(a - b) <= tol;
}

/** Every combination in the input space. */
function allInputs(): CalculatorInput[] {
  const out: CalculatorInput[] = [];
  for (const suit of SUIT_TYPES)
    for (const size of BODY_SIZES)
      for (const quality of FUR_QUALITIES)
        for (const width of FUR_WIDTHS)
          for (const buffer of [0, 5, 10, 15, 20, 30, 40])
            for (const colors of [1, 2, 3, 4, 5, 6])
              for (const tail of [false, true])
                for (const mark of [false, true])
                  out.push({
                    suitType: suit.id,
                    bodySize: size.id,
                    furQuality: quality.id,
                    furWidthId: width.id,
                    bufferPercent: buffer,
                    colorCount: colors,
                    largeTail: tail,
                    complexMarkings: mark,
                  });
  return out;
}

console.log('=== SWEEPING INPUT SPACE ===');
const inputs = allInputs();
console.log(`combinations: ${inputs.length}\n`);

for (const input of inputs) {
  const r = calculateYardage(input);
  const tag = `${input.suitType}/${input.bodySize}/${input.furQuality}/${input.furWidthId}/buf${input.bufferPercent}/c${input.colorCount}${input.largeTail ? '/tail' : ''}${input.complexMarkings ? '/mark' : ''}`;

  // --- finiteness ---------------------------------------------------------
  check(Number.isFinite(r.totalYards), `${tag}: total finite`);
  check(Number.isFinite(r.baseYards), `${tag}: base finite`);
  check(Number.isFinite(r.yardsPerColor), `${tag}: perColor finite`);
  check(Number.isFinite(r.effectiveAreaSqYd), `${tag}: area finite`);
  check(Number.isFinite(r.yardsToBuy), `${tag}: buy finite`);

  // --- non-negativity -----------------------------------------------------
  check(r.totalYards >= 0, `${tag}: total >= 0`);
  check(r.baseYards >= 0, `${tag}: base >= 0`);
  check(r.yardsPerColor >= 0, `${tag}: perColor >= 0`);
  check(r.colors.every((c) => c.yards >= 0), `${tag}: no negative colour`);
  check(r.allowances.wasteYards >= 0, `${tag}: waste >= 0`);
  check(r.allowances.napYards >= 0, `${tag}: nap >= 0`);
  check(r.allowances.bufferYards >= 0, `${tag}: buffer >= 0`);

  // --- ordering: allowances only ever increase ---------------------------
  check(r.totalYards >= r.baseYards, `${tag}: total >= base`);
  if (r.baseYards > 0) {
    check(r.totalYards > r.baseYards, `${tag}: total strictly > base`);
  }

  // --- colour sum must equal total (within rounding of one row) ----------
  const colorSum = r.colors.reduce((s, c) => s + c.yards, 0);
  check(
    approx(colorSum, r.totalYards, 0.011 * r.colors.length + 0.001),
    `${tag}: colour sum ${colorSum.toFixed(3)} == total ${r.totalYards}`,
  );
  check(r.colors.length === input.colorCount, `${tag}: colour count matches`);

  // --- colour shares should sum to ~100% --------------------------------
  const shareSum = r.colors.reduce((s, c) => s + c.sharePercent, 0);
  check(approx(shareSum, 1, 0.02), `${tag}: shares sum ${shareSum.toFixed(3)} == 1`);

  // --- per-colour average must be >= the smallest colour ---------------
  const minColor = Math.min(...r.colors.map((c) => c.yards));
  check(
    r.yardsPerColor <= r.totalYards + 0.02,
    `${tag}: perColor <= total`,
  );
  check(minColor <= r.yardsPerColor + 0.02, `${tag}: min colour <= perColor`);

  // --- part sum must equal total ----------------------------------------
  const covered = r.parts.filter((p) => p.covered);
  const partSum = covered.reduce((s, p) => s + p.adjustedYards, 0);
  check(
    approx(partSum, r.totalYards, 0.011 * covered.length + 0.001),
    `${tag}: part sum ${partSum.toFixed(3)} == total ${r.totalYards}`,
  );

  // --- uncovered parts must be zero -------------------------------------
  for (const p of r.parts) {
    if (!p.covered) {
      check(p.areaSqYd === 0, `${tag}: uncovered ${p.id} area 0`);
      check(p.baseYards === 0, `${tag}: uncovered ${p.id} base 0`);
      check(p.adjustedYards === 0, `${tag}: uncovered ${p.id} adjusted 0`);
      check(p.sharePercent === 0, `${tag}: uncovered ${p.id} share 0`);
    }
  }

  // --- buy quantity -----------------------------------------------------
  check(
    r.yardsToBuy >= Math.ceil(r.totalYards) - 1e-9,
    `${tag}: buy >= ceil(total)`,
  );
  check(r.yardsToBuy >= input.colorCount, `${tag}: buy >= colourCount`);
  check(Number.isInteger(r.yardsToBuy), `${tag}: buy is integer`);

  // --- monotonicity in buffer ------------------------------------------
  if (input.bufferPercent > 0) {
    const lower = calculateYardage({ ...input, bufferPercent: input.bufferPercent - 5 });
    check(
      r.totalYards >= lower.totalYards - 0.02,
      `${tag}: total monotonic in buffer`,
    );
  }

  // --- text export must not contain undefined/NaN ----------------------
  const text = formatResultAsText(input, r);
  check(!text.includes('undefined'), `${tag}: no undefined in text`);
  check(!text.includes('NaN'), `${tag}: no NaN in text`);

  // --- cut layout must reconstruct the total ---------------------------
  const layout = computeCutLayout(input, r);
  check(layout !== null, `${tag}: layout exists`);
  if (layout) {
    const pieceSum = layout.pieces.reduce((s, p) => s + p.yards, 0);
    check(approx(pieceSum, r.baseYards, 0.02), `${tag}: layout pieces == baseYards`);
    check(approx(layout.totalWithAllowances, r.totalYards, 0.02), `${tag}: layout total == totalYards`);
    check(layout.pieces.every((p) => p.yards > 0), `${tag}: layout pieces positive`);
  }
}

console.log(`\nran ${checks} assertions across ${inputs.length} combinations`);
console.log(failures === 0 ? 'ALL PASS' : `${failures} FAILURES`);

// --- Targeted semantic checks ---------------------------------------------

console.log('\n=== SEMANTIC CHECKS ===');

const base: CalculatorInput = {
  suitType: 'full-digitigrade',
  bodySize: 'average',
  furQuality: 'standard',
  furWidthId: 'w60',
  bufferPercent: 15,
  colorCount: 1,
  largeTail: false,
  complexMarkings: false,
};

const headOnly = calculateYardage({ ...base, suitType: 'head-only' });
const partial = calculateYardage({ ...base, suitType: 'partial' });
const full = calculateYardage({ ...base, suitType: 'full-digitigrade' });
const planti = calculateYardage({ ...base, suitType: 'full-plantigrade' });

console.log(`head-only        ${headOnly.totalYards} yd`);
console.log(`partial          ${partial.totalYards} yd`);
console.log(`full plantigrade ${planti.totalYards} yd`);
console.log(`full digitigrade ${full.totalYards} yd`);

check(headOnly.totalYards < partial.totalYards, 'head < partial');
check(partial.totalYards < planti.totalYards, 'partial < full plantigrade');
check(planti.totalYards < full.totalYards, 'plantigrade < digitigrade (padding costs fur)');

// Wider bolt must need less yardage.
const narrow = calculateYardage({ ...base, furWidthId: 'w58' });
const wide = calculateYardage({ ...base, furWidthId: 'w72' });
console.log(`58in bolt        ${narrow.totalYards} yd`);
console.log(`72in bolt        ${wide.totalYards} yd`);
check(wide.totalYards < narrow.totalYards, 'wider bolt needs less yardage');

// Larger body must need more.
const petite = calculateYardage({ ...base, bodySize: 'petite' });
const plus = calculateYardage({ ...base, bodySize: 'plus' });
console.log(`petite           ${petite.totalYards} yd`);
console.log(`plus             ${plus.totalYards} yd`);
check(petite.totalYards < plus.totalYards, 'petite < plus');

// Adding colours must increase the total.
let prev = 0;
let colourMonotonic = true;
for (const n of [1, 2, 3, 4, 5, 6]) {
  const r = calculateYardage({ ...base, colorCount: n });
  if (r.totalYards < prev - 1e-9) colourMonotonic = false;
  prev = r.totalYards;
}
check(colourMonotonic, 'total increases with colour count');

// Zero buffer must equal the no-buffer subtotal.
const zeroBuf = calculateYardage({ ...base, bufferPercent: 0, complexMarkings: false });
check(
  approx(zeroBuf.totalYards, zeroBuf.baseYards + zeroBuf.allowances.wasteYards + zeroBuf.allowances.napYards, 0.03),
  'zero buffer: total == base + waste + nap',
);

// Markings must add exactly 8% of the subtotal.
const noMark = calculateYardage({ ...base, complexMarkings: false });
const withMark = calculateYardage({ ...base, complexMarkings: true });
const subtotal = noMark.baseYards + noMark.allowances.wasteYards + noMark.allowances.napYards;
console.log(`markings off     ${noMark.totalYards} yd`);
console.log(`markings on      ${withMark.totalYards} yd`);
check(
  approx(noMark.allowances.bufferYards, subtotal * 0.15, 0.02),
  'no markings: buffer allowance == 15% of subtotal',
);
check(
  approx(withMark.allowances.bufferYards, subtotal * 0.23, 0.02),
  'markings on: buffer allowance == 23% of subtotal (15% + 8%)',
);
check(
  approx(withMark.totalYards, subtotal * 1.23, 0.03),
  'markings: total == subtotal x 1.23',
);

// Large tail must add yardage.
const noTail = calculateYardage({ ...base, largeTail: false });
const bigTail = calculateYardage({ ...base, largeTail: true });
const tailDelta = bigTail.totalYards - noTail.totalYards;
const tailPart = noTail.parts.find((p) => p.id === 'tail')!;
check(tailDelta > 0, 'large tail adds yardage');
console.log(`large tail adds  ${tailDelta.toFixed(2)} yd (tail part is ${tailPart.adjustedYards} yd)`);

// Head-only must not include torso/arms/legs.
check(
  headOnly.parts.filter((p) => p.covered).length === 1,
  'head-only covers exactly one region',
);

// usableWidthYd helper: single source of truth sanity checks.
check(approx(usableWidthYd(60, 1.07), ((60 - 2) / 36) / 1.07, 1e-12), 'usableWidthYd formula');
check(usableWidthYd(60, 0) > 0, 'usableWidthYd guards zero napFactor');
check(usableWidthYd(60, NaN) > 0, 'usableWidthYd guards NaN napFactor');

// Query codec round-trip.
console.log('\n=== QUERY CODEC ===');
const queryInput: CalculatorInput = {
  suitType: 'tail-only',
  bodySize: 'plus',
  furQuality: 'premium',
  furWidthId: 'w72',
  bufferPercent: 25,
  colorCount: 4,
  largeTail: true,
  complexMarkings: true,
};
const query = inputToQuery(queryInput);
console.log(`encoded: ?${query}`);
check(query.includes('t=tail-only'), 'query: suit type encoded');
check(query.includes('lt=1'), 'query: large tail encoded');
check(query.includes('cm=1'), 'query: complex markings encoded');
const decoded = applyQueryToInput(new URLSearchParams(query), {
  ...base,
  bufferPercent: 15,
  colorCount: 3,
});
check(
  JSON.stringify(decoded) === JSON.stringify(queryInput),
  'query: round-trip restores exact input',
);
// Garbage must fall back, never smuggle invalid state in.
const garbage = applyQueryToInput(
  new URLSearchParams('t=banana&b=42&q=&w=w999&p=9999&c=-3&lt=yes'),
  base,
);
check(
  garbage.suitType === base.suitType &&
    garbage.bodySize === base.bodySize &&
    garbage.furQuality === base.furQuality &&
    garbage.furWidthId === base.furWidthId &&
    garbage.bufferPercent === base.bufferPercent &&
    garbage.colorCount === base.colorCount &&
    garbage.largeTail === false,
  'query: garbage input falls back to defaults',
);

console.log('\n' + (failures === 0 ? 'ALL CHECKS PASS' : `${failures} TOTAL FAILURES`));
process.exit(failures === 0 ? 0 : 1);
