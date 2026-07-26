import { ref, computed } from 'vue'

/**
 * Logique du mode X01 — saisie fléchette par fléchette, double-out obligatoire.
 *
 * Règles implémentées :
 * - Finish valide : dernier dart de type 'double' OU Bull (50 pts)
 * - Bust si : score résultant < 0 | = 1 | = 0 sans double
 * - Bust annule toute la volée (score revient à la valeur avant la volée)
 *
 * @param {{ startScore: number, legsToWin: number, players?: Array }} settings
 *   players: tableau de joueurs humains (optionnel, défaut = 1 joueur)
 */
export function useX01({ startScore, legsToWin, players = null }) {
  const playerCount = players?.length ?? 1
  const isMulti     = playerCount > 1

  // ─── Per-player state ──────────────────────────────────────────────────────
  const allVolleys       = Array.from({ length: playerCount }, () => ref([]))
  const allCompletedLegs = Array.from({ length: playerCount }, () => ref([]))
  // All legs in chronological order per player: { volleys, won, totalDarts, checkoutScore? }
  const allLegsOrdered   = Array.from({ length: playerCount }, () => ref([]))
  const lastLegWinnerIndex = ref(null)

  const currentPlayerIndex = ref(0)

  // Writable computed aliases → current player's arrays
  const volleys = computed({
    get: () => allVolleys[currentPlayerIndex.value].value,
    set: (v) => { allVolleys[currentPlayerIndex.value].value = v },
  })
  const completedLegs = computed({
    get: () => allCompletedLegs[currentPlayerIndex.value].value,
    set: (v) => { allCompletedLegs[currentPlayerIndex.value].value = v },
  })

  // ─── État principal ────────────────────────────────────────────────────────
  const currentDarts         = ref([])
  const phase                = ref('playing')
  const volleyCompleting     = ref(false)
  const pendingDoublesPrompt = ref(false)
  const pendingCheckout      = ref(null)

  let _bustTimer     = null
  let _completeTimer = null

  // ─── Calculs ──────────────────────────────────────────────────────────────
  const legRemaining = computed(() =>
    volleys.value
      .filter(v => !v.bust)
      .reduce((acc, v) => acc - v.score, startScore)
  )

  const volleyRemaining = computed(() =>
    currentDarts.value.reduce((acc, d) => acc - d.pts, legRemaining.value)
  )

  const displayRemaining = computed(() => Math.max(0, volleyRemaining.value))

  const legNumber    = computed(() => allCompletedLegs[0].value.length + 1)
  const volleyNumber = computed(() => volleys.value.length + 1)

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function isValidCheckout(dart) {
    return dart.type === 'double' || (dart.type === 'bull' && dart.pts === 50)
  }

  function advancePlayer() {
    if (!isMulti) return
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % playerCount
  }

  function triggerBust(newDarts, wasInCheckoutZone = false) {
    clearTimeout(_bustTimer)
    volleys.value.push({ darts: newDarts, bust: true, score: 0 })
    currentDarts.value = []
    phase.value = 'bust'
    _bustTimer = setTimeout(() => {
      if (phase.value === 'bust') phase.value = 'playing'
      if (wasInCheckoutZone) {
        pendingDoublesPrompt.value = true
      } else {
        advancePlayer()
      }
    }, 900)
  }

  function finishLeg() {
    const totalDarts    = volleys.value.reduce((sum, v) => sum + v.darts.length, 0)
    const checkoutScore = volleys.value[volleys.value.length - 1].score
    const winnerIndex   = currentPlayerIndex.value

    lastLegWinnerIndex.value = winnerIndex

    // Record this leg for ALL players in chronological order
    for (let i = 0; i < playerCount; i++) {
      const legVolleys = [...allVolleys[i].value]
      const won        = i === winnerIndex
      allLegsOrdered[i].value.push({
        volleys: legVolleys,
        won,
        totalDarts: won ? totalDarts : legVolleys.reduce((s, v) => s + v.darts.length, 0),
        checkoutScore: won ? checkoutScore : null,
      })
    }

    allCompletedLegs[winnerIndex].value.push({
      volleys:      [...volleys.value],
      totalDarts,
      checkoutScore,
    })

    const maxLegsWon = Math.max(...allCompletedLegs.map(r => r.value.length))
    if (maxLegsWon >= legsToWin) {
      phase.value = 'game-over'
    } else {
      phase.value = 'leg-recap'
    }
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function addDart(dart) {
    if (phase.value !== 'playing' || volleyCompleting.value) return

    const remainingAtStart = legRemaining.value
    const inCheckoutZone   = remainingAtStart <= 50

    const newDarts  = [...currentDarts.value, dart]
    const volleyPts = newDarts.reduce((sum, d) => sum + d.pts, 0)
    const newRem    = remainingAtStart - volleyPts

    if (newRem < 0 || newRem === 1) {
      triggerBust(newDarts, inCheckoutZone)
      return
    }

    if (newRem === 0) {
      if (isValidCheckout(dart)) {
        currentDarts.value = newDarts
        volleyCompleting.value = true
        const score = volleyPts
        const darts = [...newDarts]
        clearTimeout(_completeTimer)
        _completeTimer = setTimeout(() => {
          volleys.value.push({ darts, bust: false, score })
          currentDarts.value = []
          volleyCompleting.value = false
          pendingCheckout.value = { defaultDarts: darts.length, checkoutScore: score }
        }, 700)
      } else {
        triggerBust(newDarts, inCheckoutZone)
      }
      return
    }

    currentDarts.value = newDarts

    if (currentDarts.value.length === 3) {
      volleyCompleting.value = true
      const score = currentDarts.value.reduce((sum, d) => sum + d.pts, 0)
      const darts = [...currentDarts.value]
      clearTimeout(_completeTimer)
      _completeTimer = setTimeout(() => {
        volleys.value.push({ darts, bust: false, score })
        currentDarts.value = []
        volleyCompleting.value = false
        if (inCheckoutZone) {
          pendingDoublesPrompt.value = true
        } else {
          advancePlayer()
        }
      }, 700)
    }
  }

  // ─── Mode volée totale ────────────────────────────────────────────────────
  function confirmVolleyTotal(total) {
    if (phase.value !== 'playing' || volleyCompleting.value) return

    const remainingAtStart = legRemaining.value
    const inCheckoutZone   = remainingAtStart <= 50
    const newRem           = remainingAtStart - total
    const syntheticDart    = { pts: total, type: 'volley', label: String(total), sector: null }

    if (newRem < 0 || newRem === 1) {
      triggerBust([syntheticDart], inCheckoutZone)
      return
    }

    if (newRem === 0) {
      currentDarts.value     = [syntheticDart]
      volleyCompleting.value = true
      clearTimeout(_completeTimer)
      _completeTimer = setTimeout(() => {
        volleys.value.push({ darts: [syntheticDart], bust: false, score: total })
        currentDarts.value     = []
        volleyCompleting.value = false
        pendingCheckout.value  = { defaultDarts: 1, checkoutScore: total }
      }, 700)
      return
    }

    currentDarts.value     = [syntheticDart]
    volleyCompleting.value = true
    clearTimeout(_completeTimer)
    _completeTimer = setTimeout(() => {
      volleys.value.push({ darts: [syntheticDart], bust: false, score: total })
      currentDarts.value     = []
      volleyCompleting.value = false
      if (inCheckoutZone) {
        pendingDoublesPrompt.value = true
      } else {
        advancePlayer()
      }
    }, 700)
  }

  function bustVolley() {
    if (phase.value !== 'playing' || volleyCompleting.value) return
    const inCheckoutZone = legRemaining.value <= 50
    triggerBust([{ pts: 0, type: 'miss', label: 'Bust', sector: null }], inCheckoutZone)
  }

  function confirmDoublesAttempted(n) {
    if (volleys.value.length > 0) {
      const last = volleys.value[volleys.value.length - 1]
      volleys.value[volleys.value.length - 1] = { ...last, doublesAttempted: n }
    }
    pendingDoublesPrompt.value = false
    advancePlayer()
  }

  function confirmCheckout({ dartsToFinish, doublesThrown }) {
    if (volleys.value.length > 0) {
      const last = volleys.value[volleys.value.length - 1]
      volleys.value[volleys.value.length - 1] = { ...last, dartsToFinish, doublesThrown }
    }
    pendingCheckout.value = null
    finishLeg()
  }

  function addMiss() {
    addDart({ pts: 0, type: 'miss', label: 'Miss', sector: null })
  }

  function undo() {
    if (volleyCompleting.value) {
      clearTimeout(_completeTimer)
      volleyCompleting.value = false
      currentDarts.value = currentDarts.value.slice(0, -1)
      return
    }

    if (phase.value === 'bust') {
      clearTimeout(_bustTimer)
      volleys.value.pop()
      currentDarts.value = []
      phase.value = 'playing'
      return
    }

    if (currentDarts.value.length > 0) {
      currentDarts.value = currentDarts.value.slice(0, -1)
      return
    }

    if (volleys.value.length > 0) {
      const last = volleys.value.pop()
      if (!last.bust) {
        currentDarts.value = last.darts.slice(0, -1)
      }
    }
  }

  function startNextLeg() {
    clearTimeout(_completeTimer)
    clearTimeout(_bustTimer)
    // Reset all players' current leg state
    for (const pVolleys of allVolleys) pVolleys.value = []
    currentDarts.value         = []
    volleyCompleting.value     = false
    pendingDoublesPrompt.value = false
    pendingCheckout.value      = null
    // 2 joueurs : alterne le joueur qui démarre, en partant de celui placé en premier.
    // 3+ joueurs : même ordre à chaque manche (toujours le joueur placé en premier).
    const legsPlayed           = allLegsOrdered[0].value.length
    currentPlayerIndex.value   = playerCount === 2 ? legsPlayed % 2 : 0
    phase.value                = 'playing'
  }

  // ─── Moyenne en temps réel (joueur courant) ───────────────────────────────
  const liveAvgVolley = computed(() => {
    const idx         = currentPlayerIndex.value
    const pastVolleys = allLegsOrdered[idx].value.flatMap(l => l.volleys)
    const all         = [...pastVolleys, ...allVolleys[idx].value]
    if (!all.length) return '–'
    const sum = all.reduce((s, v) => s + (v.bust ? 0 : v.score), 0)
    return (sum / all.length).toFixed(2)
  })

  // Called from view when AI wins a leg (single-player vs AI mode)
  function addLostLegVolleys(legVolleys) {
    allLegsOrdered[0].value.push({
      volleys:    [...legVolleys],
      won:        false,
      totalDarts: legVolleys.reduce((s, v) => s + v.darts.length, 0),
      checkoutScore: null,
    })
  }

  // ─── Statistiques finales (joueur 0 = utilisateur connecté) ──────────────
  function computeStatsForPlayer(idx) {
    const orderedLegs = allLegsOrdered[idx].value
    const wonLegs     = allCompletedLegs[idx].value
    if (!orderedLegs.length) return null

    const allVs   = orderedLegs.flatMap(l => l.volleys)
    const validVs = allVs.filter(v => !v.bust)
    const scores  = validVs.map(v => v.score)

    const avgVolley = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0

    const first3Scores = wonLegs.flatMap(l =>
      l.volleys.filter(v => !v.bust).slice(0, 3).map(v => v.score)
    )
    const avg9darts = first3Scores.length
      ? Math.round(first3Scores.reduce((a, b) => a + b, 0) / first3Scores.length)
      : 0

    const doublesHit       = wonLegs.length
    const doublesAttempted = allVs.reduce((sum, v) => {
      if (v.doublesThrown != null)    return sum + v.doublesThrown
      if (v.doublesAttempted != null) return sum + v.doublesAttempted
      return sum
    }, 0)

    const dartsPerWonLeg   = wonLegs.map(l => l.totalDarts)
    const avgDartsToFinish = dartsPerWonLeg.length
      ? Math.round(dartsPerWonLeg.reduce((a, b) => a + b, 0) / dartsPerWonLeg.length)
      : 0

    let bestLeg  = null
    let worstLeg = null
    if (wonLegs.length) {
      const sorted = [...wonLegs].sort((a, b) => a.totalDarts - b.totalDarts)
      bestLeg  = { darts: sorted[0].totalDarts, checkoutScore: sorted[0].checkoutScore }
      worstLeg = { darts: sorted[sorted.length - 1].totalDarts, checkoutScore: sorted[sorted.length - 1].checkoutScore }
    }

    const highestFinish = wonLegs.length ? Math.max(...wonLegs.map(l => l.checkoutScore), 0) : 0
    const highestVolley = scores.length ? Math.max(...scores) : 0

    const totalDarts = orderedLegs.reduce((s, leg) => s + leg.totalDarts, 0)

    const thresholds = [160, 140, 120, 100, 80, 60, 40]
    const volleyDistribution = { '40': 0, '60': 0, '80': 0, '100': 0, '120': 0, '140': 0, '160': 0, '180': 0 }
    for (const v of validVs) {
      if (v.score === 180) { volleyDistribution['180']++; continue }
      const bucket = thresholds.find(t => v.score >= t)
      if (bucket != null) volleyDistribution[String(bucket)]++
    }

    // All legs in chronological order (won + lost)
    const legAverages = orderedLegs.map((leg, i) => {
      const valid = leg.volleys.filter(v => !v.bust)
      const avg   = valid.length ? Math.round(valid.reduce((s, v) => s + v.score, 0) / valid.length) : 0
      return { leg: i + 1, avg, won: leg.won }
    })

    return {
      avgVolley, avg9darts, avgDartsToFinish, doublesHit, doublesAttempted,
      highestFinish, highestVolley, bestLeg, worstLeg, volleyDistribution, legAverages,
      totalDarts,
    }
  }

  const stats = computed(() => computeStatsForPlayer(0))

  return {
    // State
    completedLegs,
    volleys,
    currentDarts,
    phase,
    volleyCompleting,
    pendingDoublesPrompt,
    pendingCheckout,
    // Computed
    legRemaining,
    legNumber,
    volleyNumber,
    // Actions
    addDart,
    addMiss,
    undo,
    confirmVolleyTotal,
    bustVolley,
    confirmDoublesAttempted,
    confirmCheckout,
    startNextLeg,
    addLostLegVolleys,
    stats,
    liveAvgVolley,
    // Multi-player
    currentPlayerIndex,
    playerCount,
    allCompletedLegs,
    allVolleys,
    lastLegWinnerIndex,
    computeStatsForPlayer,
  }
}
