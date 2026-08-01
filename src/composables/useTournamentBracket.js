// Génération pure d'un bracket de tournoi (aucun état réactif, aucun accès Supabase).
// Les matchs sont d'abord construits avec des seeds (1..N) et une clé synthétique
// (`winner-<round>-<slot>` etc.) ; resolveMatches() les convertit ensuite en lignes
// prêtes à insérer une fois les participants créés en base (seed -> id réel).

function nextPowerOfTwo(n) {
  return 2 ** Math.ceil(Math.log2(n))
}

export function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0
}

// Ordre de seeding standard d'un bracket ([1,8,4,5,2,7,3,6] pour une taille 8...),
// construit récursivement : seedOrder(2N) = pour chaque s de seedOrder(N) : [s, 2N+1-s]
function seedOrder(size) {
  if (size === 1) return [1]
  const prev = seedOrder(size / 2)
  const result = []
  for (const s of prev) result.push(s, size + 1 - s)
  return result
}

function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// roster: array de joueurs (forme X01PlayerPicker), dans l'ordre choisi si seeding manuel
export function assignSeeds(roster, seedingMethod) {
  const ordered = seedingMethod === 'random' ? shuffle(roster) : roster
  return ordered.map((player, i) => ({ ...player, seed: i + 1 }))
}

function matchKey(bracketType, round, slot) {
  return `${bracketType}-${round}-${slot}`
}

function buildWinnerRound1(participantCount, bracketSize) {
  const order = seedOrder(bracketSize)
  const slots = order.map((seed) => (seed <= participantCount ? seed : null))
  const round1 = []
  for (let i = 0; i < slots.length; i += 2) {
    const p1 = slots[i]
    const p2 = slots[i + 1]
    const slot = round1.length + 1
    const key = matchKey('winner', 1, slot)
    if (p1 && p2) {
      round1.push({ key, bracketType: 'winner', round: 1, slotInRound: slot, player1Seed: p1, player2Seed: p2, status: 'ready', winnerSeed: null })
    } else {
      // Bye : un seul côté du match existe réellement, il avance automatiquement.
      round1.push({ key, bracketType: 'winner', round: 1, slotInRound: slot, player1Seed: p1, player2Seed: p2, status: 'bye', winnerSeed: p1 ?? p2 })
    }
  }
  return round1
}

// Construit tous les rounds du winner bracket. Les byes ne peuvent exister qu'au
// round 1 : dès qu'un feeder est un bye, son vainqueur est reporté immédiatement
// dans le round suivant (pas besoin d'attendre qu'un match soit joué).
function buildWinnerBracket(participantCount) {
  const bracketSize = nextPowerOfTwo(participantCount)
  const rounds = [buildWinnerRound1(participantCount, bracketSize)]

  let current = rounds[0]
  let roundNum = 2
  while (current.length > 1) {
    const next = []
    for (let i = 0; i < current.length; i += 2) {
      const feederA = current[i]
      const feederB = current[i + 1]
      const p1 = feederA.status === 'bye' ? feederA.winnerSeed : null
      const p2 = feederB.status === 'bye' ? feederB.winnerSeed : null
      const slot = next.length + 1
      const key = matchKey('winner', roundNum, slot)
      next.push({
        key, bracketType: 'winner', round: roundNum, slotInRound: slot,
        player1Seed: p1, player2Seed: p2,
        status: p1 && p2 ? 'ready' : 'pending',
        winnerSeed: null,
      })
      feederA.nextMatchKey = key
      feederA.nextMatchSlot = 1
      feederB.nextMatchKey = key
      feederB.nextMatchSlot = 2
    }
    rounds.push(next)
    current = next
    roundNum++
  }

  return rounds
}

// Loser bracket (double élimination) : structure standard alternant "drop-in"
// (les perdants du winner bracket entrent) et "consolidation" (les survivants du
// loser bracket s'affrontent entre eux), jusqu'à un match LB final unique.
//
// Limitation V1 assumée : uniquement supporté pour un effectif exactement
// puissance de 2 (4/8/16/32...), où chaque match du winner bracket produit un
// perdant réel (aucun bye) — ce qui garantit des effectifs pairs à chaque étape.
// Combiner byes + double élimination est un cas non géré pour l'instant.
function buildLoserBracket(winnerRounds) {
  const lbMatches = []
  let roundNum = 1

  function pairEntrants(entrants, sourceFieldPrefix) {
    const survivors = []
    for (let i = 0; i < entrants.length; i += 2) {
      const a = entrants[i]
      const b = entrants[i + 1]
      const slot = survivors.length + 1
      const key = matchKey('loser', roundNum, slot)
      const match = { key, bracketType: 'loser', round: roundNum, slotInRound: slot, player1Seed: null, player2Seed: null, status: 'pending', winnerSeed: null }
      lbMatches.push(match)
      a[`${sourceFieldPrefix}Key`] = key
      a[`${sourceFieldPrefix}Slot`] = 1
      b[`${sourceFieldPrefix}Key`] = key
      b[`${sourceFieldPrefix}Slot`] = 2
      survivors.push(match)
    }
    roundNum++
    return survivors
  }

  function dropIn(survivors, wbLosers) {
    const merged = []
    for (let i = 0; i < survivors.length; i++) {
      const s = survivors[i]
      const l = wbLosers[i]
      const slot = merged.length + 1
      const key = matchKey('loser', roundNum, slot)
      const match = { key, bracketType: 'loser', round: roundNum, slotInRound: slot, player1Seed: null, player2Seed: null, status: 'pending', winnerSeed: null }
      lbMatches.push(match)
      s.nextMatchKey = key
      s.nextMatchSlot = 1
      l.loserNextMatchKey = key
      l.loserNextMatchSlot = 2
      merged.push(match)
    }
    roundNum++
    return merged
  }

  let survivors = pairEntrants(winnerRounds[0], 'loserNextMatch')

  for (let r = 1; r < winnerRounds.length; r++) {
    survivors = dropIn(survivors, winnerRounds[r])
    if (r < winnerRounds.length - 1 && survivors.length > 1) {
      survivors = pairEntrants(survivors, 'nextMatch')
    }
  }

  return { lbMatches, lbFinalist: survivors[0] }
}

// Point d'entrée : construit le graphe complet (winner bracket + éventuel loser
// bracket + grande finale), en seeds — aucun id Supabase n'est encore attribué.
export function generateBracket({ roster, seedingMethod, doubleElimination }) {
  const seeded = assignSeeds(roster, seedingMethod)
  const participantCount = seeded.length
  const winnerRounds = buildWinnerBracket(participantCount)
  const matches = winnerRounds.flat()

  if (doubleElimination) {
    if (!isPowerOfTwo(participantCount)) {
      throw new Error('La double élimination nécessite un effectif puissance de 2 (4, 8, 16, 32...).')
    }
    const { lbMatches, lbFinalist } = buildLoserBracket(winnerRounds)
    matches.push(...lbMatches)

    const wbFinal = winnerRounds[winnerRounds.length - 1][0]
    const grandFinalKey = matchKey('grand_final', winnerRounds.length + 1, 1)
    const grandFinal = {
      key: grandFinalKey, bracketType: 'grand_final', round: winnerRounds.length + 1, slotInRound: 1,
      player1Seed: null, player2Seed: null, status: 'pending', winnerSeed: null,
    }
    wbFinal.nextMatchKey = grandFinalKey
    wbFinal.nextMatchSlot = 1
    lbFinalist.nextMatchKey = grandFinalKey
    lbFinalist.nextMatchSlot = 2
    matches.push(grandFinal)
  }

  return { seeded, matches }
}

// Convertit les matchs (seeds + clés synthétiques) en lignes prêtes pour l'insertion,
// une fois les participants créés en base et leur id réel connu par seed.
export function resolveMatches(matches, seedToParticipantId) {
  return matches.map((m) => ({
    key: m.key,
    bracketType: m.bracketType,
    round: m.round,
    slotInRound: m.slotInRound,
    player1ParticipantId: m.player1Seed ? seedToParticipantId[m.player1Seed] : null,
    player2ParticipantId: m.player2Seed ? seedToParticipantId[m.player2Seed] : null,
    winnerParticipantId: m.winnerSeed ? seedToParticipantId[m.winnerSeed] : null,
    status: m.status,
    nextMatchKey: m.nextMatchKey ?? null,
    nextMatchSlot: m.nextMatchSlot ?? null,
    loserNextMatchKey: m.loserNextMatchKey ?? null,
    loserNextMatchSlot: m.loserNextMatchSlot ?? null,
  }))
}
