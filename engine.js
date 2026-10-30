"use strict";
var FursuitYardage = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    BODY_SIZES: () => BODY_SIZES,
    DEFAULT_INPUT: () => DEFAULT_INPUT,
    FUR_QUALITIES: () => FUR_QUALITIES,
    FUR_WIDTHS: () => FUR_WIDTHS,
    INCHES_PER_YARD: () => INCHES_PER_YARD,
    MAX_BUFFER_PERCENT: () => MAX_BUFFER_PERCENT,
    MAX_COLOR_COUNT: () => MAX_COLOR_COUNT,
    PARTS: () => PARTS,
    SUIT_TYPES: () => SUIT_TYPES,
    applyQueryToInput: () => applyQueryToInput,
    calculateYardage: () => calculateYardage,
    computeCutLayout: () => computeCutLayout,
    formatResultAsText: () => formatResultAsText,
    inputToQuery: () => inputToQuery,
    usableWidthYd: () => usableWidthYd
  });

  // src/calculator.ts
  var SUIT_TYPES = [
    {
      id: "tail-only",
      label: "Tail only",
      shortLabel: "Tail only",
      description: "A standalone tail - the most common first project and the easiest component to sell or trade.",
      coverage: { head: 0, torso: 0, arms: 0, legs: 0, tail: 1, handsFeet: 0 }
    },
    {
      id: "head-only",
      label: "Fursuit head only",
      shortLabel: "Head only",
      description: "A single costume head. Ideal for a first build or a convention-only costume.",
      coverage: { head: 1, torso: 0, arms: 0, legs: 0, tail: 0, handsFeet: 0 }
    },
    {
      id: "partial",
      label: "Partial suit (head, hands, feet, tail)",
      shortLabel: "Partial",
      description: "Head plus paws, footpaws and a tail. Worn with your own clothing.",
      coverage: { head: 1, torso: 0, arms: 0, legs: 0, tail: 1, handsFeet: 1 }
    },
    {
      id: "full-digitigrade",
      label: "Full suit - digitigrade legs",
      shortLabel: "Full, digitigrade",
      description: "Full body coverage with padded digitigrade legs and a built-in tail.",
      coverage: { head: 1, torso: 1, arms: 1, legs: 1, tail: 1, handsFeet: 1 }
    },
    {
      id: "full-plantigrade",
      label: "Full suit - plantigrade legs",
      shortLabel: "Full, plantigrade",
      description: "Full body coverage with straight legs and a separate tail.",
      coverage: { head: 1, torso: 1, arms: 1, legs: 1, tail: 1, handsFeet: 1 }
    }
  ];
  var BODY_SIZES = [
    { id: "petite", label: "Petite", areaMultiplier: 0.85, heightHint: "Under 5 ft 2 in / 157 cm" },
    { id: "average", label: "Average", areaMultiplier: 1, heightHint: "5 ft 2 in - 5 ft 10 in / 157 - 178 cm" },
    { id: "tall", label: "Tall", areaMultiplier: 1.12, heightHint: "Over 5 ft 10 in / 178 cm" },
    { id: "plus", label: "Plus / broad build", areaMultiplier: 1.22, heightHint: "Any height, wider torso or limbs" }
  ];
  var FUR_QUALITIES = [
    {
      id: "budget",
      label: "Budget craft fur",
      wasteFactor: 0.14,
      napFactor: 1.04,
      note: "Short pile, thin backing. Sheds more and stretches unevenly, so expect more offcuts."
    },
    {
      id: "standard",
      label: "Standard fur (most common)",
      wasteFactor: 0.1,
      napFactor: 1.07,
      note: "The typical 2 in pile faux fur used in most first builds. Good balance of cost and looks."
    },
    {
      id: "luxury",
      label: "Luxury / dense pile",
      wasteFactor: 0.08,
      napFactor: 1.1,
      note: "Thick backing, dense pile. Cuts cleanly but the nap eats into usable length."
    },
    {
      id: "premium",
      label: "Specialty (shag, airbrush base)",
      wasteFactor: 0.12,
      napFactor: 1.14,
      note: "Long or directional pile. Requires strict one-way layout, which wastes the most fabric."
    }
  ];
  var FUR_WIDTHS = [
    { id: "w58", inches: 58, label: "58 in (148 cm) - narrow bolt" },
    { id: "w60", inches: 60, label: "60 in (152 cm) - standard bolt" },
    { id: "w62", inches: 62, label: "62 in (157 cm) - wide bolt" },
    { id: "w72", inches: 72, label: "72 in (183 cm) - upholstery width" }
  ];
  var INCHES_PER_YARD = 36;
  var PARTS = [
    {
      id: "head",
      label: "Head",
      baseAreaSqYd: 1.62,
      paletteShare: 0.55,
      note: "Includes muzzle, ears, cheek tufts and a chin/neck overlap."
    },
    {
      id: "torso",
      label: "Torso",
      baseAreaSqYd: 4.2,
      paletteShare: 0.35,
      note: "Body shell with a chest marking and an arm/leg seam allowance."
    },
    {
      id: "arms",
      label: "Arms",
      baseAreaSqYd: 2.6,
      paletteShare: 0.18,
      note: "Both sleeves including elbow gussets and cuff overlap."
    },
    {
      id: "legs",
      label: "Legs",
      baseAreaSqYd: 3.7,
      paletteShare: 0.2,
      note: "Both legs. Digitigrade builds add roughly a third again in padding."
    },
    {
      id: "tail",
      label: "Tail",
      baseAreaSqYd: 1.35,
      paletteShare: 0.45,
      note: "Large tail with a tip marking. Add more for a floor-dragging tail."
    },
    {
      id: "handsFeet",
      label: "Hands & feet",
      baseAreaSqYd: 1.15,
      paletteShare: 0.25,
      note: "Handpaws, footpaws and their claws or toe pads."
    }
  ];
  var DIGITIGRADE_LEG_FACTOR = 1.32;
  function usableWidthYd(widthInches, napFactor) {
    const nap = Number.isFinite(napFactor) && napFactor > 0 ? napFactor : 1;
    return (widthInches - 2) / INCHES_PER_YARD * (1 / nap);
  }
  var LARGE_TAIL_FACTOR = 1.5;
  var COMPLEX_MARKING_FACTOR = 1.08;
  function round(value, decimals = 2) {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }
  function clampNumber(value, min, max, fallback) {
    return Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback;
  }
  var MAX_COLOR_COUNT = 6;
  var MAX_BUFFER_PERCENT = 100;
  function calculateYardage(input) {
    const suitType = SUIT_TYPES.find((s) => s.id === input.suitType) ?? SUIT_TYPES[2];
    const bodySize = BODY_SIZES.find((b) => b.id === input.bodySize) ?? BODY_SIZES[1];
    const quality = FUR_QUALITIES.find((q) => q.id === input.furQuality) ?? FUR_QUALITIES[1];
    const width = FUR_WIDTHS.find((w) => w.id === input.furWidthId) ?? FUR_WIDTHS[1];
    const colorCount = clampNumber(Math.round(input.colorCount), 1, MAX_COLOR_COUNT, 1);
    const bufferPercent = clampNumber(input.bufferPercent, 0, MAX_BUFFER_PERCENT, 0);
    const warnings = [];
    const isDigitigrade = suitType.id === "full-digitigrade";
    const parts = PARTS.map((part) => {
      const coverage = suitType.coverage[part.id];
      let area = part.baseAreaSqYd * bodySize.areaMultiplier * coverage;
      if (part.id === "legs" && isDigitigrade) area *= DIGITIGRADE_LEG_FACTOR;
      if (part.id === "tail" && input.largeTail) area *= LARGE_TAIL_FACTOR;
      return {
        id: part.id,
        label: part.label,
        areaSqYd: round(area, 3),
        baseYards: 0,
        adjustedYards: 0,
        sharePercent: 0,
        note: part.note,
        covered: coverage > 0
      };
    });
    const coveredParts = parts.filter((p) => p.covered);
    const totalAreaSqYd = coveredParts.reduce((sum, p) => sum + p.areaSqYd, 0);
    const usable = usableWidthYd(width.inches, quality.napFactor);
    const baseYards = totalAreaSqYd / usable;
    const wasteYards = baseYards * quality.wasteFactor;
    const napYards = baseYards * (quality.napFactor - 1);
    const subtotal = baseYards + wasteYards + napYards;
    const markingMultiplier = input.complexMarkings ? COMPLEX_MARKING_FACTOR : 1;
    const bufferYards = subtotal * (bufferPercent / 100) + subtotal * (markingMultiplier - 1);
    const multiplierPerColor = 1 + (colorCount - 1) * 0.06;
    const totalYards = (subtotal + bufferYards) * multiplierPerColor;
    const accentWeights = Array.from(
      { length: Math.max(colorCount - 1, 0) },
      (_, i) => Math.max(1 - i * 0.15, 0.4)
    );
    const weightTotal = 1.4 + accentWeights.reduce((a, b) => a + b, 0);
    const colors = [];
    let allocated = 0;
    for (let i = 0; i < colorCount; i += 1) {
      const weight = i === 0 ? 1.4 : accentWeights[i - 1];
      const isLast = i === colorCount - 1;
      const yards = isLast ? totalYards - allocated : totalYards * weight / weightTotal;
      allocated += yards;
      colors.push({
        index: i + 1,
        label: i === 0 ? "Primary colour" : i === 1 ? "Accent 1" : `Accent ${i}`,
        yards: round(Math.max(yards, 0), 2),
        sharePercent: totalYards > 0 ? round(yards / totalYards, 3) : 0
      });
    }
    for (const part of parts) {
      part.baseYards = round(totalAreaSqYd > 0 ? part.areaSqYd / usable : 0, 2);
      part.adjustedYards = round(
        totalAreaSqYd > 0 ? part.areaSqYd / totalAreaSqYd * totalYards : 0,
        2
      );
      part.sharePercent = totalAreaSqYd > 0 ? round(part.areaSqYd / totalAreaSqYd, 3) : 0;
    }
    if (colorCount > 3) {
      warnings.push(
        `${colorCount} colours is a lot for a single build. Every extra colour adds both a seam and a fresh set of offcuts.`
      );
    }
    if (bufferPercent < 10) {
      warnings.push(
        "A buffer under 10% is tight. Faux fur pile shifts when you cut, and a mis-cut panel usually costs a whole length."
      );
    }
    if (quality.id === "premium") {
      warnings.push(
        "Long-pile fur can only be laid one way. Budget for the nap factor rather than trying to nest pattern pieces."
      );
    }
    if (input.largeTail) {
      warnings.push("Large tail selected: tail yardage has been increased by 50%.");
    }
    if (!parts.some((p) => p.covered)) {
      warnings.push("No body regions selected. Pick a suit type to see a result.");
    }
    const coverageNote = suitType.id === "tail-only" ? "A standalone tail only. Belt loops, the attachment clip and any stuffing are separate purchases." : suitType.id === "head-only" ? "Head-only builds are the cheapest way to test a colour scheme before committing to a full suit." : suitType.id === "partial" ? "Partial suits assume you supply your own clothing, so no torso or limb fur is included." : "Full suits include the torso, both arms, both legs and the tail.";
    return {
      baseYards: round(baseYards, 2),
      totalYards: round(totalYards, 2),
      yardsPerColor: round(totalYards / colorCount, 2),
      allowances: {
        wasteFactor: quality.wasteFactor,
        napFactor: quality.napFactor,
        bufferPercent,
        wasteYards: round(wasteYards, 2),
        napYards: round(napYards, 2),
        bufferYards: round(bufferYards, 2)
      },
      parts,
      colors,
      yardsToBuy: Math.max(Math.ceil(totalYards), colorCount),
      effectiveAreaSqYd: round(totalAreaSqYd, 2),
      coverageNote,
      warnings
    };
  }
  var DEFAULT_INPUT = {
    suitType: "full-digitigrade",
    bodySize: "average",
    furQuality: "standard",
    furWidthId: "w60",
    bufferPercent: 15,
    colorCount: 3,
    largeTail: false,
    complexMarkings: false
  };
  function formatResultAsText(input, result) {
    const suitType = SUIT_TYPES.find((s) => s.id === input.suitType);
    const bodySize = BODY_SIZES.find((b) => b.id === input.bodySize);
    const quality = FUR_QUALITIES.find((q) => q.id === input.furQuality);
    const width = FUR_WIDTHS.find((w) => w.id === input.furWidthId);
    const colorCount = clampNumber(Math.round(input.colorCount), 1, MAX_COLOR_COUNT, 1);
    const bufferPercent = clampNumber(input.bufferPercent, 0, MAX_BUFFER_PERCENT, 0);
    const lines = [];
    lines.push("FURSUIT FUR YARDAGE ESTIMATE");
    lines.push("============================");
    lines.push("");
    lines.push(`Suit type:     ${suitType?.label ?? "-"}`);
    lines.push(`Body size:     ${bodySize?.label ?? "-"}`);
    lines.push(`Fur quality:   ${quality?.label ?? "-"}`);
    lines.push(`Fur width:     ${width?.inches ?? "-"} in usable bolt`);
    lines.push(`Buffer:        ${bufferPercent}%`);
    lines.push(`Colour count:  ${colorCount}`);
    if (input.largeTail) lines.push("Large tail:    yes");
    if (input.complexMarkings) lines.push("Complex marks: yes");
    lines.push("");
    lines.push("RESULT");
    lines.push("------");
    lines.push(`Total fur to buy:   ${result.totalYards.toFixed(2)} yd  (buy ${result.yardsToBuy} yd)`);
    lines.push(`Average per colour: ${result.yardsPerColor.toFixed(2)} yd`);
    lines.push(`Base yardage:       ${result.baseYards.toFixed(2)} yd`);
    lines.push("");
    lines.push("PER COLOUR");
    lines.push("----------");
    for (const c of result.colors) {
      lines.push(`${c.label.padEnd(16)} ${c.yards.toFixed(2)} yd  (${Math.round(c.sharePercent * 100)}%)`);
    }
    lines.push("");
    lines.push("BREAKDOWN BY BODY REGION");
    lines.push("------------------------");
    for (const p of result.parts) {
      if (!p.covered) continue;
      lines.push(
        `${p.label.padEnd(16)} base ${p.baseYards.toFixed(2)} yd | incl. allowances ${p.adjustedYards.toFixed(2)} yd | ${Math.round(p.sharePercent * 100)}% of area`
      );
    }
    lines.push("");
    lines.push("ALLOWANCES APPLIED");
    lines.push("------------------");
    lines.push(`Waste (${Math.round(result.allowances.wasteFactor * 100)}%):     +${result.allowances.wasteYards.toFixed(2)} yd`);
    lines.push(`Nap / pile direction:  +${result.allowances.napYards.toFixed(2)} yd`);
    lines.push(`Your buffer (${result.allowances.bufferPercent}%):  +${result.allowances.bufferYards.toFixed(2)} yd`);
    lines.push("");
    if (result.warnings.length > 0) {
      lines.push("NOTES");
      lines.push("-----");
      for (const w of result.warnings) lines.push(`- ${w}`);
      lines.push("");
    }
    lines.push("Estimate only. Results depend on pattern, pile direction and your cutting style.");
    lines.push("Generated with the Fursuit Fur Yardage Calculator.");
    return lines.join("\n");
  }

  // src/layout.ts
  function computeCutLayout(input, result) {
    const width = FUR_WIDTHS.find((w) => w.id === input.furWidthId) ?? FUR_WIDTHS[1];
    const napFactor = result.allowances.napFactor || 1;
    const usable = usableWidthYd(width.inches, napFactor);
    const covered = result.parts.filter((p) => p.covered && p.areaSqYd > 0);
    if (covered.length === 0 || result.totalYards <= 0) return null;
    const pieces = covered.map((part) => ({
      id: part.id,
      label: part.label,
      yards: part.areaSqYd / usable
    }));
    const allowanceYards = Math.max(result.totalYards - result.baseYards, 0);
    return {
      usableWidthYd: usable,
      pieces,
      allowanceYards,
      totalWithAllowances: pieces.reduce((s, p) => s + p.yards, 0) + allowanceYards
    };
  }

  // src/query.ts
  function inputToQuery(input) {
    const params = new URLSearchParams();
    params.set("t", input.suitType);
    params.set("b", input.bodySize);
    params.set("q", input.furQuality);
    params.set("w", input.furWidthId);
    params.set("p", String(input.bufferPercent));
    params.set("c", String(input.colorCount));
    if (input.largeTail) params.set("lt", "1");
    if (input.complexMarkings) params.set("cm", "1");
    return params.toString();
  }
  function applyQueryToInput(query, fallback) {
    const suitType = SUIT_TYPES.some((s) => s.id === query.get("t")) ? query.get("t") : fallback.suitType;
    const bodySize = BODY_SIZES.some((b) => b.id === query.get("b")) ? query.get("b") : fallback.bodySize;
    const furQuality = FUR_QUALITIES.some((q) => q.id === query.get("q")) ? query.get("q") : fallback.furQuality;
    const furWidthId = FUR_WIDTHS.some((w) => w.id === query.get("w")) ? query.get("w") : fallback.furWidthId;
    const num = (key, min, max, dflt) => {
      const raw = Number(query.get(key));
      return Number.isFinite(raw) && raw >= min && raw <= max ? Math.round(raw) : dflt;
    };
    return {
      suitType,
      bodySize,
      furQuality,
      furWidthId,
      bufferPercent: num("p", 0, MAX_BUFFER_PERCENT, fallback.bufferPercent),
      colorCount: num("c", 1, MAX_COLOR_COUNT, fallback.colorCount),
      largeTail: query.get("lt") === "1",
      complexMarkings: query.get("cm") === "1"
    };
  }
  return __toCommonJS(index_exports);
})();
