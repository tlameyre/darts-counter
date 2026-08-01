import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase.js'
import { useDbStore } from './dbStore.js'
import { useAuthStore } from './authStore.js'
import { generateBracket, resolveMatches } from '../composables/useTournamentBracket.js'

export const useTournamentStore = defineStore('tournament', () => {
  const tournaments      = ref([])
  const activeTournament = ref(null) // { tournament, hosts, participants, matches }
  const loading          = ref(false)

  // ── Notification "nouveau tournoi" (pastille nav, même principe que friendStore) ──
  const myTournamentIds    = ref([])
  const seenTournamentIds  = ref(new Set())
  let   participantChannel = null

  function seenStorageKey() {
    const userId = useAuthStore().user?.id
    return userId ? `tournament_seen_${userId}` : null
  }
  function loadSeenIds() {
    const key = seenStorageKey()
    if (!key) return
    try {
      seenTournamentIds.value = new Set(JSON.parse(localStorage.getItem(key) ?? '[]'))
    } catch {
      seenTournamentIds.value = new Set()
    }
  }
  function persistSeenIds() {
    const key = seenStorageKey()
    if (key) localStorage.setItem(key, JSON.stringify([...seenTournamentIds.value]))
  }

  const unseenTournamentCount = computed(() =>
    myTournamentIds.value.filter(id => !seenTournamentIds.value.has(id)).length
  )

  async function fetchMyParticipations() {
    loadSeenIds()
    myTournamentIds.value = await useDbStore().fetchMyParticipantTournamentIds()
  }

  function markTournamentSeen(tournamentId) {
    if (!tournamentId || seenTournamentIds.value.has(tournamentId)) return
    seenTournamentIds.value.add(tournamentId)
    persistSeenIds()
  }

  function subscribeToMyParticipations() {
    const userId = useAuthStore().user?.id
    if (!userId || participantChannel) return
    participantChannel = supabase
      .channel('tournament-participants-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants' }, () => {
        fetchMyParticipations()
      })
      .subscribe()
  }
  function unsubscribeFromMyParticipations() {
    if (participantChannel) {
      supabase.removeChannel(participantChannel)
      participantChannel = null
    }
  }

  // ── Realtime : page détail d'un tournoi (participants/hôtes/suppression) ──
  let tournamentDetailChannel = null

  function subscribeToTournamentDetail(tournamentId, { onDeleted } = {}) {
    if (tournamentDetailChannel) return
    tournamentDetailChannel = supabase
      .channel(`tournament-detail-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants', filter: `tournament_id=eq.${tournamentId}` }, () => fetchTournamentDetail(tournamentId))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_hosts', filter: `tournament_id=eq.${tournamentId}` }, () => fetchTournamentDetail(tournamentId))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` }, () => fetchTournamentDetail(tournamentId))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` }, () => {
        activeTournament.value = null
        onDeleted?.()
      })
      .subscribe()
  }
  function unsubscribeFromTournamentDetail() {
    if (tournamentDetailChannel) {
      supabase.removeChannel(tournamentDetailChannel)
      tournamentDetailChannel = null
    }
  }

  // ── Realtime : page liste des tournois ──
  let tournamentListChannel = null

  function subscribeToTournamentList() {
    if (tournamentListChannel) return
    tournamentListChannel = supabase
      .channel('tournament-list-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => fetchTournaments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants' }, () => fetchTournaments())
      .subscribe()
  }
  function unsubscribeFromTournamentList() {
    if (tournamentListChannel) {
      supabase.removeChannel(tournamentListChannel)
      tournamentListChannel = null
    }
  }

  const isHost = computed(() => {
    const userId = useAuthStore().user?.id
    return activeTournament.value?.hosts?.some(h => h.user_id === userId) ?? false
  })
  const isParticipant = computed(() => {
    const userId = useAuthStore().user?.id
    return activeTournament.value?.participants?.some(p => p.user_id === userId) ?? false
  })

  async function fetchTournaments() {
    loading.value = true
    tournaments.value = await useDbStore().fetchTournaments()
    loading.value = false
    return tournaments.value
  }

  async function fetchActiveTournaments(limit = 3) {
    return useDbStore().fetchActiveTournaments(limit)
  }

  async function fetchTournamentDetail(id) {
    loading.value = true
    activeTournament.value = await useDbStore().fetchTournamentDetail(id)
    loading.value = false
    return activeTournament.value
  }

  // Crée le tournoi en statut "pending" : le créateur devient hôte + participant,
  // aucun bracket n'est généré (roster ouvert jusqu'au démarrage).
  async function createTournamentShell({ name, description, startScore, legsToWin }) {
    const dbStore   = useDbStore()
    const authStore = useAuthStore()
    const tournament = await dbStore.createTournamentRecord({ name, description, startScore, legsToWin })
    if (!tournament) return null

    await dbStore.addTournamentHost(tournament.id, authStore.user.id, 'creator')
    await dbStore.createTournamentParticipants(tournament.id, [{
      userId:     authStore.user.id,
      playerData: { id: authStore.user.id, name: authStore.profile?.username ?? 'Toi', isMe: true, isRegistered: true },
    }])

    return tournament.id
  }

  // Génère le bracket à partir du roster actuellement inscrit et démarre le tournoi.
  // useTournamentBracket.js est inchangé : seul le moment de l'appel diffère de la V1.
  async function startTournament({ tournamentId, seedingMethod, doubleElimination, manualSeedOrder = null }) {
    const dbStore = useDbStore()
    const detail  = await dbStore.fetchTournamentDetail(tournamentId)
    if (!detail) return false

    const roster = (manualSeedOrder ?? detail.participants).map(p => ({
      ...p.player_data,
      participantRowId: p.id,
    }))

    const { seeded, matches } = generateBracket({ roster, seedingMethod, doubleElimination })

    await dbStore.assignParticipantSeeds(seeded.map(p => ({ id: p.participantRowId, seed: p.seed })))

    const seedToParticipantId = Object.fromEntries(seeded.map(p => [p.seed, p.participantRowId]))
    const resolved  = resolveMatches(matches, seedToParticipantId)
    const matchRows = await dbStore.createTournamentMatches(tournamentId, resolved)
    const keyToId   = Object.fromEntries(matchRows.map(r => [`${r.bracket_type}-${r.round}-${r.slot_in_round}`, r.id]))

    const pointerUpdates = resolved
      .filter(m => m.nextMatchKey || m.loserNextMatchKey)
      .map(m => ({
        id:                    keyToId[m.key],
        next_match_id:         m.nextMatchKey ? keyToId[m.nextMatchKey] : null,
        next_match_slot:       m.nextMatchSlot ?? null,
        loser_next_match_id:   m.loserNextMatchKey ? keyToId[m.loserNextMatchKey] : null,
        loser_next_match_slot: m.loserNextMatchSlot ?? null,
      }))
    if (pointerUpdates.length) await dbStore.updateTournamentMatchPointers(pointerUpdates)

    await dbStore.updateTournament(tournamentId, {
      status:             'in_progress',
      seeding_method:     seedingMethod,
      double_elimination: doubleElimination,
      player_count:       seeded.length,
    })

    await fetchTournamentDetail(tournamentId)
    return true
  }

  async function fetchTournamentPreviewByCode(code) {
    return useDbStore().findTournamentByCode(code)
  }

  async function joinTournament(code) {
    const dbStore     = useDbStore()
    const tournamentId = await dbStore.joinTournamentByCode(code)
    if (tournamentId) await fetchTournaments()
    return tournamentId
  }

  async function leaveTournament(tournamentId) {
    await useDbStore().leaveTournament(tournamentId)
    await fetchTournaments()
  }

  async function updateTournamentName(tournamentId, name) {
    await useDbStore().updateTournament(tournamentId, { name })
    await fetchTournamentDetail(tournamentId)
  }

  async function addHost(tournamentId, userId) {
    await useDbStore().addTournamentHost(tournamentId, userId, 'host')
    await fetchTournamentDetail(tournamentId)
  }

  async function removeHost(tournamentId, userId) {
    await useDbStore().removeTournamentHost(tournamentId, userId)
    await fetchTournamentDetail(tournamentId)
  }

  async function removeParticipant(tournamentId, participantId) {
    await useDbStore().deleteTournamentParticipant(participantId)
    await fetchTournamentDetail(tournamentId)
  }

  async function deleteTournament(tournamentId) {
    const ok = await useDbStore().deleteTournament(tournamentId)
    if (ok) {
      tournaments.value = tournaments.value.filter(t => t.id !== tournamentId)
      if (activeTournament.value?.tournament?.id === tournamentId) activeTournament.value = null
    }
    return ok
  }

  // player vient de X01PlayerPicker : { id, name, isFriend?, isRegistered?, isGuest? }.
  // Un ami ou un utilisateur trouvé par recherche a un vrai compte (id = auth.users.id) :
  // il faut le lier via user_id pour que ce participant voie le tournoi de son côté
  // (RLS scope l'accès via tournament_participants.user_id, pas juste player_data).
  async function addGuestParticipant(tournamentId, player) {
    const hasAccount = player.isFriend || player.isRegistered
    await useDbStore().addGuestParticipant(tournamentId, {
      playerData:     player,
      userId:         hasAccount ? player.id : null,
      linkedFriendId: player.isFriend ? player.id : null,
    })
    await fetchTournamentDetail(tournamentId)
  }

  // Pure : construit l'objet à assigner à gameStore.gameSettings pour lancer un match prêt.
  function buildGameSettingsForMatch(matchId) {
    const t = activeTournament.value
    if (!t) return null
    const match = t.matches.find(m => m.id === matchId)
    if (!match || match.status !== 'ready') return null
    const p1 = t.participants.find(p => p.id === match.player1_participant_id)
    const p2 = t.participants.find(p => p.id === match.player2_participant_id)
    if (!p1 || !p2) return null

    return {
      mode:       'x01',
      startScore: t.tournament.start_score,
      legsToWin:  t.tournament.legs_to_win,
      aiProfile:  null,
      players: [
        { ...p1.player_data, participantId: p1.id },
        { ...p2.player_data, participantId: p2.id },
      ],
      tournamentContext: { tournamentId: t.tournament.id, matchId: match.id },
    }
  }

  // Fait avancer le vainqueur (et, en cas de double élimination, le perdant vers le
  // loser bracket) vers le(s) match(s) suivant(s), et clôt le tournoi si c'était le
  // match final (repérable : aucun next_match_id).
  async function recordMatchResult({ matchId, winnerParticipantId }) {
    const dbStore = useDbStore()
    const updated = await dbStore.updateTournamentMatch(matchId, {
      winner_participant_id: winnerParticipantId,
      status:                'completed',
      played_at:              new Date().toISOString(),
    })
    if (!updated) return

    const loserParticipantId = updated.player1_participant_id === winnerParticipantId
      ? updated.player2_participant_id
      : updated.player1_participant_id

    if (updated.next_match_id) {
      await advanceParticipant(dbStore, updated.next_match_id, updated.next_match_slot, winnerParticipantId)
    }
    if (updated.loser_next_match_id && loserParticipantId) {
      await advanceParticipant(dbStore, updated.loser_next_match_id, updated.loser_next_match_slot, loserParticipantId)
    }

    if (!updated.next_match_id) {
      await dbStore.updateTournament(updated.tournament_id, {
        status:                 'completed',
        winner_participant_id:  winnerParticipantId,
        completed_at:           new Date().toISOString(),
      })
    }

    if (activeTournament.value?.tournament?.id === updated.tournament_id) {
      await fetchTournamentDetail(updated.tournament_id)
    }
  }

  async function advanceParticipant(dbStore, matchId, slot, participantId) {
    const field   = slot === 1 ? 'player1_participant_id' : 'player2_participant_id'
    const partial = await dbStore.updateTournamentMatch(matchId, { [field]: participantId })
    if (!partial) return
    if (partial.player1_participant_id && partial.player2_participant_id && partial.status === 'pending') {
      await dbStore.updateTournamentMatch(matchId, { status: 'ready' })
    }
  }

  return {
    tournaments, activeTournament, loading, isHost, isParticipant,
    fetchTournaments, fetchActiveTournaments, fetchTournamentDetail,
    createTournamentShell, startTournament,
    fetchTournamentPreviewByCode, joinTournament, leaveTournament,
    updateTournamentName, addHost, removeHost, removeParticipant, deleteTournament, addGuestParticipant,
    buildGameSettingsForMatch, recordMatchResult,
    unseenTournamentCount, fetchMyParticipations, markTournamentSeen,
    subscribeToMyParticipations, unsubscribeFromMyParticipations,
    subscribeToTournamentDetail, unsubscribeFromTournamentDetail,
    subscribeToTournamentList, unsubscribeFromTournamentList,
  }
})
