import { ref, computed } from "vue";
import {
  getCheckout,
  isValidFinish,
  matchesRoute,
  buildPool,
  bracketPoints,
} from "./useCheckouts.js";

/**
 * État d'une session du mode Checkouts.
 *
 * @param {{
 *   variant: 'review' | 'quiz',
 *   brackets: Array<[number, number]>,
 *   order?: 'asc' | 'random',
 *   count?: number,   // quiz : nombre de checkouts (Infinity = illimité)
 * }} settings
 */
export function useCheckoutTrainer({ variant, brackets, order = "asc", count = 10 }) {
  const isQuiz = variant === "quiz";
  const infinite = !Number.isFinite(count);
  const pool = buildPool(brackets, order);

  const pickRandom = () => pool[Math.floor(Math.random() * pool.length)];

  function buildQueue() {
    if (!isQuiz) return [...pool];
    if (infinite) return [pickRandom()];
    return Array.from({ length: count }, pickRandom);
  }

  const queue = ref(buildQueue());
  const index = ref(0);
  const gameOver = ref(false);

  const currentScore = computed(() => queue.value[index.value] ?? null);
  const currentCheckout = computed(() => getCheckout(currentScore.value));
  const total = computed(() => (infinite ? Infinity : queue.value.length));
  const progress = computed(() => ({ index: index.value, total: total.value }));

  // ─── Révision (répétition espacée sur la durée de la session) ──────
  const revealed = ref(false);
  const toggleReveal = () => { revealed.value = !revealed.value; };

  const knownScores = ref([]); // checkouts marqués « acquis »
  const REINSERT_GAP = 6; // cartes avant de revoir un checkout raté

  const reviewDone = computed(() => knownScores.value.length);
  const reviewTotal = pool.length;

  /** Note la carte courante ; `known=false` la replace plus loin dans la file. */
  function grade(known) {
    if (isQuiz) return;
    const score = currentScore.value;
    if (known) {
      if (!knownScores.value.includes(score)) knownScores.value.push(score);
    } else {
      const at = Math.min(index.value + REINSERT_GAP, queue.value.length);
      queue.value.splice(at, 0, score);
    }
    revealed.value = false;
    if (knownScores.value.length >= pool.length || index.value + 1 >= queue.value.length) {
      gameOver.value = true;
      return;
    }
    index.value += 1;
  }

  // ─── Quiz ──────────────────────────────────────────────────────────
  const attemptDarts = ref([]);
  const answered = ref(false);
  const results = ref([]); // { score, darts, correct, optimal, points }
  let streak = 0;
  let bestStreak = 0;

  function submit() {
    if (answered.value || attemptDarts.value.length === 0) return;
    answered.value = true;
    const score = currentScore.value;
    const correct = isValidFinish(attemptDarts.value, score);
    const optimal = correct && matchesRoute(attemptDarts.value, currentCheckout.value?.primary);
    const points = correct ? bracketPoints(score) : 0;
    if (correct) {
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
    } else {
      streak = 0;
    }
    results.value.push({ score, darts: [...attemptDarts.value], correct, optimal, points });
  }

  function pushDart(dart) {
    if (answered.value || attemptDarts.value.length >= 3) return;
    attemptDarts.value = [...attemptDarts.value, dart];
    if (isValidFinish(attemptDarts.value, currentScore.value)) submit();
  }

  function undoDart() {
    if (answered.value) return;
    attemptDarts.value = attemptDarts.value.slice(0, -1);
  }

  const lastResult = computed(() => results.value[results.value.length - 1] ?? null);

  const sessionStats = computed(() => {
    const r = results.value;
    return {
      questions: r.length,
      correct: r.filter((x) => x.correct).length,
      optimal: r.filter((x) => x.optimal).length,
      bestStreak,
      points: r.reduce((s, x) => s + x.points, 0),
    };
  });

  // ─── Navigation quiz ──────────────────────────────────────────────
  function next() {
    if (infinite) {
      queue.value = [...queue.value, pickRandom()];
    } else if (index.value + 1 >= queue.value.length) {
      gameOver.value = true;
      return;
    }
    index.value += 1;
    revealed.value = false;
    attemptDarts.value = [];
    answered.value = false;
  }

  const endSession = () => { gameOver.value = true; };
  const cleanup = () => {};

  return {
    variant,
    isQuiz,
    infinite,
    currentScore,
    currentCheckout,
    gameOver,
    progress,
    total,
    revealed,
    toggleReveal,
    grade,
    reviewDone,
    reviewTotal,
    attemptDarts,
    answered,
    pushDart,
    undoDart,
    submit,
    results,
    lastResult,
    sessionStats,
    next,
    endSession,
    cleanup,
  };
}
