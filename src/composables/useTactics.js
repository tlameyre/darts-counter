import { ref, computed } from 'vue'

/**
 * Logique du mode Tactics — fermeture façon cricket de 12 zones (20→12, Double, Triple, Bull).
 *
 * Règles implémentées :
 * - Phase nombres : fermeture stricte 20→12, une seule zone active à la fois.
 *   Un double/triple sur la zone active peut aussi être crédité aux zones Double/Triple
 *   (choix explicite via pendingZoneChoice) tant que celles-ci ne sont pas fermées.
 * - Phase spéciales : une fois les 9 nombres fermés, enchaîne dans l'ordre Double → Triple → Bull.
 *   Seul un dart du type exact de la zone active compte (Double/Triple = 1 visite/touche ;
 *   Bull intérieur (50 pts) = 2 visites, Outer (25 pts) = 1 visite).
 * - Pas de bust, pas de scoring : une visite valide crédite toujours, une fléchette hors-cible est perdue.
 *
 * @param {{ players?: Array, legsToWin?: number }} settings
 */
export function useTactics({ players = null, legsToWin = 1 }) {
  const playerCount = players?.length ?? 1
  const isMulti      = playerCount > 1
  const meIndex       = players ? Math.max(0, players.findIndex(p => p.isMe)) : 0

  const NUMBER_IDS  = ['20', '19', '18', '17', '16', '15', '14', '13', '12']
  const SPECIAL_IDS  = ['double', 'triple', 'bull']
  const ZONES_ORDER  = [...NUMBER_IDS, ...SPECIAL_IDS]

  function zoneLabel(id) {
    if (id === 'double') return 'Double'
    if (id === 'triple') return 'Triple'
    if (id === 'bull')   return 'Bull'
    return id
  }

  function makeInitialZones() {
    return ZONES_ORDER.map(id => ({ id, label: zoneLabel(id), visits: 0, closed: false }))
  }

  // ─── Per-player state ──────────────────────────────────────────────────────
  const allVolleys       = Array.from({ length: playerCount }, () => ref([]))
  const allCompletedLegs = Array.from({ length: playerCount }, () => ref([]))
  const allLegsOrdered   = Array.from({ length: playerCount }, () => ref([]))
  const lastLegWinnerIndex = ref(null)

  const currentPlayerIndex = ref(0)
  const legStarterIndex    = ref(0)

  const volleys = computed({
    get: () => allVolleys[currentPlayerIndex.value].value,
    set: (v) => { allVolleys[currentPlayerIndex.value].value = v },
  })

  // ─── État principal ────────────────────────────────────────────────────────
  const currentDarts     = ref([])
  const phase            = ref('playing')
  const volleyCompleting = ref(false)
  const pendingZoneChoice = ref(null) // { dart, numberZoneId, specialZoneId }

  let _completeTimer = null

  const legNumber    = computed(() => allCompletedLegs[0].value.length + 1)
  const volleyNumber = computed(() => volleys.value.length + 1)

  // ─── Zones dérivées de l'historique des fléchettes ────────────────────────
  // Chaque dart enregistré porte un `zoneEffect: { zoneId, weight } | null` déterminé
  // au moment où il est joué. Les zones sont donc toujours recalculables (undo trivial).
  function computeZonesFromDarts(darts) {
    const zones = makeInitialZones()
    for (const dart of darts) {
      if (!dart.zoneEffect) continue
      const zone = zones.find(z => z.id === dart.zoneEffect.zoneId)
      if (!zone || zone.closed) continue
      zone.visits = Math.min(3, zone.visits + dart.zoneEffect.weight)
      if (zone.visits >= 3) zone.closed = true
    }
    return zones
  }

  function pastDartsFor(playerIdx) {
    return allVolleys[playerIdx].value.flatMap(v => v.darts)
  }

  function playerDarts(playerIdx) {
    const past = pastDartsFor(playerIdx)
    return playerIdx === currentPlayerIndex.value ? [...past, ...currentDarts.value] : past
  }

  function zonesForPlayer(playerIdx) {
    return computeZonesFromDarts(playerDarts(playerIdx))
  }

  function activeZoneIdFrom(zonesArr) {
    for (const id of NUMBER_IDS) {
      if (!zonesArr.find(z => z.id === id).closed) return id
    }
    for (const id of SPECIAL_IDS) {
      if (!zonesArr.find(z => z.id === id).closed) return id
    }
    return null
  }

  function activeZoneIdForPlayer(playerIdx) {
    return activeZoneIdFrom(zonesForPlayer(playerIdx))
  }

  const zones        = computed(() => zonesForPlayer(currentPlayerIndex.value))
  const activeZoneId  = computed(() => activeZoneIdFrom(zones.value))
  const isNumbersPhase = computed(() => activeZoneId.value != null && NUMBER_IDS.includes(activeZoneId.value))
  const isSpecialPhase = computed(() => activeZoneId.value != null && !isNumbersPhase.value)

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function advancePlayer() {
    if (!isMulti) return
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % playerCount
  }

  // Détermine l'effet d'un dart sur les zones, ou 'ambiguous' si un choix est nécessaire.
  function determineEffect(dart, activeId, currentZones) {
    if (NUMBER_IDS.includes(activeId)) {
      const activeNumber = Number(activeId)
      if (dart.type === 'bull' || dart.sector !== activeNumber) return null
      if (dart.type === 'single') return { zoneId: activeId, weight: 1 }
      if (dart.type === 'double' || dart.type === 'triple') {
        const specialId     = dart.type
        const specialClosed = currentZones.find(z => z.id === specialId).closed
        if (specialClosed) return { zoneId: activeId, weight: dart.type === 'double' ? 2 : 3 }
        return 'ambiguous'
      }
      return null
    }

    if (activeId === 'bull') {
      if (dart.type !== 'bull') return null
      return { zoneId: 'bull', weight: dart.pts === 50 ? 2 : 1 }
    }

    // Phase spéciale double/triple : seul le type exact compte
    return dart.type === activeId ? { zoneId: activeId, weight: 1 } : null
  }

  function isGameFinishedFor(playerIdx, extraDarts) {
    const past = pastDartsFor(playerIdx)
    return computeZonesFromDarts([...past, ...extraDarts]).every(z => z.closed)
  }

  function pushDart(dartWithEffect) {
    const newDarts = [...currentDarts.value, dartWithEffect]
    currentDarts.value = newDarts

    const finished = isGameFinishedFor(currentPlayerIndex.value, newDarts)
    if (!finished && newDarts.length < 3) return

    volleyCompleting.value = true
    const darts = [...newDarts]
    clearTimeout(_completeTimer)
    _completeTimer = setTimeout(() => {
      volleys.value.push({ darts })
      currentDarts.value = []
      volleyCompleting.value = false
      if (finished) finishLeg()
      else advancePlayer()
    }, 500)
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  function addDart(dart) {
    if (phase.value !== 'playing' || volleyCompleting.value || pendingZoneChoice.value) return

    const activeId = activeZoneId.value
    if (activeId == null) return

    const effect = determineEffect(dart, activeId, zones.value)
    if (effect === 'ambiguous') {
      pendingZoneChoice.value = { dart, numberZoneId: activeId, specialZoneId: dart.type }
      return
    }
    pushDart({ ...dart, zoneEffect: effect })
  }

  function addMiss() {
    addDart({ type: 'miss', sector: null, pts: 0, label: 'Miss' })
  }

  function resolveZoneChoice(target) {
    if (!pendingZoneChoice.value) return
    const { dart, numberZoneId, specialZoneId } = pendingZoneChoice.value
    pendingZoneChoice.value = null
    const effect = target === 'number'
      ? { zoneId: numberZoneId, weight: dart.type === 'double' ? 2 : 3 }
      : { zoneId: specialZoneId, weight: 1 }
    pushDart({ ...dart, zoneEffect: effect })
  }

  function undo() {
    if (volleyCompleting.value) {
      clearTimeout(_completeTimer)
      volleyCompleting.value = false
      currentDarts.value = currentDarts.value.slice(0, -1)
      return
    }

    if (pendingZoneChoice.value) {
      pendingZoneChoice.value = null
      return
    }

    if (currentDarts.value.length > 0) {
      currentDarts.value = currentDarts.value.slice(0, -1)
      return
    }

    if (volleys.value.length > 0) {
      const last = volleys.value.pop()
      currentDarts.value = last.darts.slice(0, -1)
    }
  }

  function finishLeg() {
    const winnerIndex = currentPlayerIndex.value
    const totalDarts  = playerDarts(winnerIndex).length

    lastLegWinnerIndex.value = winnerIndex

    for (let i = 0; i < playerCount; i++) {
      const legVolleys = [...allVolleys[i].value]
      const won         = i === winnerIndex
      allLegsOrdered[i].value.push({
        volleys:    legVolleys,
        won,
        totalDarts: legVolleys.reduce((s, v) => s + v.darts.length, 0),
      })
    }

    allCompletedLegs[winnerIndex].value.push({
      volleys: [...volleys.value],
      totalDarts,
    })

    const maxLegsWon = Math.max(...allCompletedLegs.map(r => r.value.length))
    phase.value = maxLegsWon >= legsToWin ? 'game-over' : 'leg-recap'
  }

  function startNextLeg() {
    clearTimeout(_completeTimer)
    for (const pVolleys of allVolleys) pVolleys.value = []
    currentDarts.value      = []
    volleyCompleting.value  = false
    pendingZoneChoice.value = null
    const legsPlayed          = allLegsOrdered[0].value.length
    currentPlayerIndex.value  = playerCount === 2 ? legsPlayed % 2 : 0
    legStarterIndex.value     = currentPlayerIndex.value
    phase.value                = 'playing'
  }

  // ─── Statistiques finales (joueur 0 = utilisateur connecté par défaut) ────
  function computeStatsForPlayer(idx) {
    const orderedLegs = allLegsOrdered[idx].value
    const wonLegs      = allCompletedLegs[idx].value
    if (!orderedLegs.length) return null

    const dartsPerWonLeg = wonLegs.map(l => l.totalDarts)
    const avgDarts = dartsPerWonLeg.length
      ? Math.round(dartsPerWonLeg.reduce((a, b) => a + b, 0) / dartsPerWonLeg.length)
      : 0

    let bestLeg  = null
    let worstLeg = null
    if (wonLegs.length) {
      const sorted = [...wonLegs].sort((a, b) => a.totalDarts - b.totalDarts)
      bestLeg  = { darts: sorted[0].totalDarts }
      worstLeg = { darts: sorted[sorted.length - 1].totalDarts }
    }

    const totalDarts = orderedLegs.reduce((s, leg) => s + leg.totalDarts, 0)

    return { avgDarts, bestLeg, worstLeg, totalDarts, legsPlayed: orderedLegs.length }
  }

  const stats = computed(() => computeStatsForPlayer(meIndex))

  return {
    // État
    zones,
    activeZoneId,
    isNumbersPhase,
    isSpecialPhase,
    currentDarts,
    phase,
    volleyCompleting,
    pendingZoneChoice,
    // Computed
    legNumber,
    volleyNumber,
    // Actions
    addDart,
    addMiss,
    undo,
    resolveZoneChoice,
    startNextLeg,
    stats,
    // Multi-joueurs
    currentPlayerIndex,
    legStarterIndex,
    playerCount,
    isMulti,
    meIndex,
    allVolleys,
    allCompletedLegs,
    lastLegWinnerIndex,
    zonesForPlayer,
    activeZoneIdForPlayer,
    playerDarts,
    computeStatsForPlayer,
  }
}
