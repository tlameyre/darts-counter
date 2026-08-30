import { CHECKOUTS, CHECKOUT_SCORES, CHECKOUT_DATA_SOURCE } from "../data/checkouts.js";

export { CHECKOUT_SCORES, CHECKOUT_DATA_SOURCE };

/**
 * Tranches de difficulté (inspirées de DartCounter "Random Checkout").
 * `points` = poids d'un checkout réussi de cette tranche dans le score du quiz.
 */
export const CHECKOUT_BRACKETS = [
  { range: [2, 40], points: 1, label: "2–40" },
  { range: [41, 60], points: 2, label: "41–60" },
  { range: [61, 80], points: 3, label: "61–80" },
  { range: [81, 90], points: 4, label: "81–90" },
  { range: [91, 100], points: 5, label: "91–100" },
  { range: [101, 130], points: 8, label: "101–130" },
  { range: [131, 170], points: 10, label: "131–170" },
];

/** Poids en points de la tranche contenant `score`. */
export function bracketPoints(score) {
  const b = CHECKOUT_BRACKETS.find(({ range: [min, max] }) => score >= min && score <= max);
  return b ? b.points : 1;
}

/** Entrée de checkout d'un score, ou null si aucune route connue. */
export function getCheckout(score) {
  return CHECKOUTS[score] ?? null;
}

/** Sorties valides d'un score : primary + options + backup si c'en est une. */
export function allRoutes(score) {
  const e = getCheckout(score);
  if (!e) return [];
  const routes = [e.primary, ...e.options];
  if (e.backup && e.backup.leaves === null) routes.push(e.backup.darts);
  return routes;
}

/** Libellé lisible d'une route : "T20 T20 Bull". */
export function formatRoute(darts) {
  return darts.map((d) => d.label).join(" ");
}

/** Clé de comparaison d'une séquence de fléchettes. */
function routeKey(darts) {
  return darts.map((d) => `${d.type}:${d.sector ?? "b"}:${d.pts}`).join("-");
}

/** Vrai si `darts` est un finish valide pour `score` (double-out, ≤ 3 fléchettes). */
export function isValidFinish(darts, score) {
  if (!darts.length || darts.length > 3) return false;
  const sum = darts.reduce((s, d) => s + d.pts, 0);
  const last = darts[darts.length - 1];
  return sum === score && (last.type === "double" || (last.type === "bull" && last.pts === 50));
}

/** Vrai si `darts` correspond exactement à la route recommandée (ordre inclus). */
export function matchesRoute(darts, route) {
  if (!route || darts.length !== route.length) return false;
  return routeKey(darts) === routeKey(route);
}

/**
 * Construit un pool de scores à réviser à partir de tranches [[min,max], ...],
 * trié croissant ou mélangé.
 */
export function buildPool(brackets, order = "asc") {
  const pool = CHECKOUT_SCORES.filter((s) =>
    brackets.some(([min, max]) => s >= min && s <= max),
  );
  if (order === "random") {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
  }
  return pool;
}
