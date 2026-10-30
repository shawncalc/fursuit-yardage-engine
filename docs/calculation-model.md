# Calculation model

This document records every constant used by `src/calculator.ts` and the reasoning
behind it, so the model can be reviewed, argued with and corrected.

**Treat these as documented assumptions, not measurements.** They are starting
values chosen to be reasonable for a typical faux fur fursuit build. If you have
real consumption data from a finished suit, that data should replace them.

---

## Stage 1 - Reference surface areas

Areas are in **square yards (yd²)** for a figure at the `average` body size
(`areaMultiplier = 1.0`). They represent the total fabric area needed for the
finished piece, including seam allowances and modest overlap.

| Region | Reference area | Included by | Notes |
|---|---|---|---|
| Head | 1.62 yd² | All suit types | Muzzle, ears, cheek tufts, chin/neck overlap |
| Torso | 4.20 yd² | Full suits only | Body shell, chest marking, arm/leg seam allowance |
| Arms | 2.60 yd² | Full suits only | Both sleeves, elbow gussets, cuff overlap |
| Legs | 3.70 yd² | Full suits only | Both legs, before the digitigrade padding factor |
| Tail | 1.35 yd² | Partial, full | Large tail, tip marking |
| Hands & feet | 1.15 yd² | Partial, full | Handpaws, footpaws, claws, toe pads |

### Suit type coverage

| Suit type | Head | Torso | Arms | Legs | Tail | Hands & feet |
|---|---|---|---|---|---|---|
| Head only | 1.0 | - | - | - | - | - |
| Partial | 1.0 | - | - | - | 1.0 | 1.0 |
| Full, digitigrade | 1.0 | 1.0 | 1.0 | 1.0 × 1.32 | 1.0 | 1.0 |
| Full, plantigrade | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 |

Coverage is a fraction, so 0 regions are omitted from the result rather than
displayed as zero.

### Body size multipliers

| Size | Multiplier | Applied to |
|---|---|---|
| Petite | 0.85 | Every region's area |
| Average | 1.00 | Reference |
| Tall | 1.12 | Every region's area |
| Plus / broad build | 1.22 | Every region's area |

**Known limitation.** A single scalar scales all regions together. In reality a
tall maker needs proportionally more torso and leg fabric but barely more head
fabric, while a plus-size maker needs much more torso. Splitting the multiplier
per region would be more accurate and is the most obvious next improvement.

### Optional area factors

| Modifier | Factor | Applies to |
|---|---|---|
| Digitigrade legs | × 1.32 | Legs |
| Large tail | × 1.50 | Tail |
| Complex markings | × 1.08 on the running subtotal | Total |

---

## Stage 2 - Area to linear yards

```
usableWidthYd = ((boltWidthInches - 2) / 36) × (1 / napFactor)
baseYards     = totalAreaSqYd / usableWidthYd
```

### Why 2 inches is removed

Every bolt carries a selvedge - a narrow, often stiffer or partially uncoated
strip along each edge that should not be used for visible panels. Two inches
total is a conservative allowance.

### Why nap divides into usable width

Faux fur has a pile direction. A pattern piece cut against the nap catches light
differently and looks wrong, so pieces cannot be rotated 90° to nest more
tightly the way they can with woven fabric. The `napFactor` reduces effective
usable width to account for the sliver of bolt that becomes unusable once pieces
are forced into one orientation.

| Fur quality | napFactor | Effective loss |
|---|---|---|
| Standard | 1.07 | ~7% |
| Luxury / dense pile | 1.10 | ~10% |
| Specialty / shag | 1.14 | ~14% |
| Budget craft fur | 1.04 | ~4% (short pile, forgiving) |

**Known limitation.** This models the nap as a uniform width reduction. A more
faithful model would simulate pattern-piece packing, which is what actually
determines the loss. That is a much larger piece of work.

---

## Stage 3 - Allowances

Applied in this order, each on top of the previous:

```
subtotal  = baseYards × (1 + wasteFactor + (napFactor - 1))
markings  = subtotal × 0.08                      (only if enabled)
buffered  = subtotal + markings + subtotal × (bufferPercent / 100)
coloured  = buffered × (1 + (colorCount - 1) × 0.06)
```

### Waste factor by fur quality

| Fur quality | wasteFactor | Reasoning |
|---|---|---|
| Budget craft fur | 0.14 | Thin backing, sheds, stretches unevenly, less tolerant of a mis-cut |
| Standard fur | 0.10 | The common 2-inch pile; the baseline |
| Luxury / dense pile | 0.08 | Thick backing cuts cleanly and holds shape |
| Specialty (shag, airbrush base) | 0.12 | Long or strongly directional pile; strict one-way layout |

This covers offcuts, narrowing towards the bolt end, and flaws in the run.

### Colour multiplier

| Colours | Multiplier | Extra |
|---|---|---|
| 1 | 1.00 | - |
| 2 | 1.06 | +6% |
| 3 | 1.12 | +12% |
| 4 | 1.18 | +18% |
| 5 | 1.24 | +24% |
| 6 | 1.30 | +30% |

Each colour adds seams between panels and its own small set of offcuts. The
overhead is sub-linear because a second colour does not double the number of
cuts - it adds a boundary.

### Buffer

User-controlled, 0-40% in 5% steps, default 15%. This is the maker's own margin
for mistakes and mid-build design changes, and it is deliberately separate from
the waste factor so that a confident maker can set it to zero without
distorting the quality-based model.

---

## Stage 4 - Splitting across colours

The total is **not** divided evenly. Colour 1 is the dominant body colour and
receives weight `1.4`; each subsequent accent receives a tapering weight:

```
accentWeight(i) = max(1 - (i - 1) × 0.15, 0.4)      for i = 1, 2, 3, ...
weightTotal     = 1.4 + sum(accentWeight)
```

For 3 colours the weights are 1.4 / 1.0 / 0.85, so the primary gets roughly 43%
and the two accents roughly 31% and 26%.

**Why weighted.** Torso, back-of-head and outer-limb panels are large and almost
always the primary colour. Accents are markings, tips and pads, which use far
less fabric. An even split would systematically under-order the primary colour,
which is the most expensive mistake because it is the hardest to match later.

The final colour is computed as `total - allocated` so rounding never leaves a
gap. The result page exposes each colour's share so a maker can override the
model with their own reference sheet.

---

## Stage 5 - Rounding and purchase quantity

- All displayed yardage is rounded to 2 decimal places.
- `yardsToBuy = max(ceil(totalYards), colorCount)` - always at least one yard
  per colour, because a fraction of a yard cannot be ordered.

---

## Warnings raised

The engine surfaces a warning when a result is likely to mislead:

| Condition | Warning |
|---|---|
| `colorCount > 3` | Extra colours add seams and offcuts |
| `bufferPercent < 10` | Buffer is tight for faux fur |
| Specialty fur selected | Long pile can only be laid one way |
| Large tail enabled | Confirms the +50% tail adjustment |
| No regions covered | Should be unreachable via the UI |

---

## Deliberate omissions

Things the model does not account for, and cannot with the current inputs:

1. **Lining, padding and stuffing.** Foam, batting and poly-fil are separate
   purchases and are not fabric.
2. **Fleece, minky and velvet.** Different nap behaviour and typically sold in
   different widths.
3. **Pattern efficiency.** A well-nested pattern can beat these numbers; a
   wasteful one will lose to them.
4. **Dye lot availability.** The model cannot tell you to buy everything at once,
   but you should.
5. **Pile length changes mid-build.** Switching to a longer pile partway through
   invalidates the nap allowance.

---

## Changing the model

The constants are plain exported objects at the top of `src/calculator.ts`.
If you adjust them:

1. Update the corresponding table in this document.
2. Re-run `npm run typecheck` and `npm run build`.
3. Sanity-check a head-only build and a full digitigrade build. Head-only should
   land near 2 yards; a full digitigrade suit in 3 colours should land in the
   low-to-mid teens including the default 15% buffer.
