import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase.js'
import { useAuthStore } from './authStore.js'

export const useDbStore = defineStore('db', () => {
  function getUser() {
    return useAuthStore().user
  }

  async function saveGameSession({ correctCount, totalQuestions, bestStreak, settings }) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('game_sessions').insert({
      user_id:         user.id,
      correct_count:   correctCount,
      total_questions: totalQuestions,
      best_streak:     bestStreak,
      settings,
    })
    if (error) console.error('[dbStore] saveGameSession:', error.message)
  }

  async function saveWarmupSession({ zones, totalDarts, hits, durationS, settings }) {
    const user = getUser()
    if (!user) return
    const accuracy = totalDarts > 0 ? Math.round((hits / totalDarts) * 100) : 0
    const zoneLabel = Array.isArray(zones)
      ? zones.map(z => {
          if (z.sector === null) return z.type === 'B' ? 'Bull' : z.type === 'SB' ? 'Outer' : 'Bull (tout)'
          const t = { S: 'S', D: 'D', T: 'T', A: '' }[z.type] ?? ''
          return `${t}${z.sector}`.trim()
        }).join('+')
      : zones
    const { error } = await supabase.from('warmup_sessions').insert({
      user_id:     user.id,
      zone:        zoneLabel,
      total_darts: totalDarts,
      hits,
      accuracy,
      duration_s:  durationS,
      settings,
    })
    if (error) console.error('[dbStore] saveWarmupSession:', error.message)
  }

  /**
   * SQL à exécuter dans Supabase pour créer la table x01_sessions :
   *
   * CREATE TABLE public.x01_sessions (
   *   id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   *   user_id             uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
   *   played_at           timestamptz DEFAULT now(),
   *   start_score         int NOT NULL,
   *   legs_played         int NOT NULL,
   *   avg_volley          numeric,
   *   avg_9darts          numeric,
   *   avg_darts_to_finish numeric,
   *   min_darts           int,
   *   max_darts           int,
   *   highest_finish      int,
   *   highest_volley      int,
   *   doubles_hit          int,
   *   doubles_attempted    int,
   *   volley_distribution  jsonb,
   *   leg_averages         jsonb,
   *   total_darts          int,
   *   settings             jsonb
   * );
   * -- Migration si la table existe déjà :
   * ALTER TABLE public.x01_sessions
   *   ADD COLUMN IF NOT EXISTS doubles_hit          int,
   *   ADD COLUMN IF NOT EXISTS doubles_attempted     int,
   *   ADD COLUMN IF NOT EXISTS volley_distribution   jsonb,
   *   ADD COLUMN IF NOT EXISTS leg_averages          jsonb,
   *   ADD COLUMN IF NOT EXISTS total_darts           int;
   * ALTER TABLE public.x01_sessions ENABLE ROW LEVEL SECURITY;
   * CREATE POLICY "Users manage own x01_sessions"
   *   ON public.x01_sessions FOR ALL USING (auth.uid() = user_id);
   */
  async function saveX01Session({ startScore, legsPlayed, stats, settings, tournamentId = null, tournamentMatchId = null }) {
    const user = getUser()
    if (!user) return null
    const { data, error } = await supabase.from('x01_sessions').insert({
      user_id:             user.id,
      start_score:         startScore,
      legs_played:         legsPlayed,
      avg_volley:          stats.avgVolley,
      avg_9darts:          stats.avg9darts,
      avg_darts_to_finish: stats.avgDartsToFinish,
      min_darts:           stats.bestLeg?.darts  ?? null,
      max_darts:           stats.worstLeg?.darts ?? null,
      highest_finish:      stats.highestFinish,
      highest_volley:      stats.highestVolley,
      doubles_hit:         stats.doublesHit           ?? null,
      doubles_attempted:   stats.doublesAttempted      ?? null,
      volley_distribution: stats.volleyDistribution    ?? null,
      leg_averages:        stats.legAverages           ?? null,
      total_darts:         stats.totalDarts            ?? null,
      settings,
      tournament_id:       tournamentId,
      tournament_match_id: tournamentMatchId,
    }).select().single()
    if (error) {
      console.error('[dbStore] saveX01Session:', error.message)
      return null
    }
    return data
  }

  /**
   * SQL à exécuter dans Supabase pour créer la table tactics_sessions :
   *
   * CREATE TABLE public.tactics_sessions (
   *   id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   *   user_id      uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
   *   played_at    timestamptz DEFAULT now(),
   *   legs_played  int NOT NULL,
   *   total_darts  int,
   *   avg_darts    numeric,
   *   min_darts    int,
   *   max_darts    int,
   *   settings     jsonb
   * );
   * ALTER TABLE public.tactics_sessions ENABLE ROW LEVEL SECURITY;
   * CREATE POLICY "Users manage own tactics_sessions"
   *   ON public.tactics_sessions FOR ALL USING (auth.uid() = user_id);
   */
  async function saveTacticsSession({ legsPlayed, stats, settings }) {
    const user = getUser()
    if (!user) return null
    const { data, error } = await supabase.from('tactics_sessions').insert({
      user_id:     user.id,
      legs_played: legsPlayed,
      total_darts: stats.totalDarts ?? null,
      avg_darts:   stats.avgDarts   ?? null,
      min_darts:   stats.bestLeg?.darts  ?? null,
      max_darts:   stats.worstLeg?.darts ?? null,
      settings,
    }).select().single()
    if (error) {
      console.error('[dbStore] saveTacticsSession:', error.message)
      return null
    }
    return data
  }

  async function fetchTacticsSessions(limit = 20) {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('tactics_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async function deleteTacticsSession(id) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('tactics_sessions').delete().eq('id', id).eq('user_id', user.id)
    if (error) console.error('[dbStore] deleteTacticsSession:', error.message)
  }

  async function fetchGameSessions(limit = 20) {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async function fetchWarmupSessions(limit = 20) {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('warmup_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async function fetchWarmupSessionsForChart() {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('warmup_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('played_at', { ascending: true })
    if (error) {
      console.error('[dbStore] fetchWarmupSessionsForChart:', error.message)
      return []
    }
    return data
  }

  async function fetchProfileStats() {
    const user = getUser()
    if (!user) return null

    const [{ data: gameSessions }, { data: warmupSessions }, { data: x01Sessions }] = await Promise.all([
      supabase.from('game_sessions').select('id, best_streak, correct_count, total_questions').eq('user_id', user.id),
      supabase.from('warmup_sessions').select('total_darts, accuracy').eq('user_id', user.id),
      supabase.from('x01_sessions').select('total_darts').eq('user_id', user.id),
    ])

    const warmupSessionsCount = warmupSessions?.length ?? 0
    const x01SessionsCount    = x01Sessions?.length ?? 0
    const gameSessionsCount   = gameSessions?.length ?? 0
    const totalSessions       = warmupSessionsCount + x01SessionsCount + gameSessionsCount

    const warmupDarts   = warmupSessions?.reduce((s, r) => s + r.total_darts, 0) ?? 0
    const x01Darts      = x01Sessions?.reduce((s, r) => s + (r.total_darts ?? 0), 0) ?? 0
    const totalDarts    = warmupDarts + x01Darts

    const avgAccuracy   = warmupSessions?.length
      ? Math.round(warmupSessions.reduce((s, r) => s + Number(r.accuracy), 0) / warmupSessions.length)
      : null
    const bestAccuracy  = warmupSessions?.length
      ? Math.max(...warmupSessions.map(r => Number(r.accuracy)))
      : 0
    const bestStreak    = gameSessions?.length
      ? Math.max(...gameSessions.map(r => r.best_streak ?? 0))
      : 0
    const totalCorrect  = gameSessions?.reduce((s, r) => s + (r.correct_count ?? 0), 0) ?? 0
    const totalQuestions = gameSessions?.reduce((s, r) => s + (r.total_questions ?? 0), 0) ?? 0
    const bestGameAccuracy = gameSessions?.length
      ? Math.max(...gameSessions.map(r => r.total_questions > 0 ? Math.round(r.correct_count / r.total_questions * 100) : 0))
      : 0

    const last10        = warmupSessions?.slice(-10) ?? []
    const avg80eligible = last10.length >= 10
    const avgAccuracy10 = avg80eligible
      ? Math.round(last10.reduce((s, r) => s + Number(r.accuracy), 0) / 10)
      : 0

    return {
      totalSessions, warmupSessionsCount, x01SessionsCount, gameSessionsCount,
      totalDarts, warmupDarts, x01Darts,
      totalQuestions, bestGameAccuracy,
      avgAccuracy, bestAccuracy, bestStreak, totalCorrect, avgAccuracy10, avg80eligible,
    }
  }

  async function deleteGameSession(id) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('game_sessions').delete().eq('id', id).eq('user_id', user.id)
    if (error) console.error('[dbStore] deleteGameSession:', error.message)
  }

  async function deleteWarmupSession(id) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('warmup_sessions').delete().eq('id', id).eq('user_id', user.id)
    if (error) console.error('[dbStore] deleteWarmupSession:', error.message)
  }

  async function deleteX01Session(id) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('x01_sessions').delete().eq('id', id).eq('user_id', user.id)
    if (error) console.error('[dbStore] deleteX01Session:', error.message)
  }

  async function fetchX01Sessions(limit = 20) {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('x01_sessions')
      .select('*, tournaments(name)')
      .eq('user_id', user.id)
      .order('played_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async function fetchGlobalStats() {
    const user = getUser()
    if (!user) return null

    const [{ data: gameSessions }, { data: warmupSessions }] = await Promise.all([
      supabase.from('game_sessions').select('correct_count, total_questions, best_streak').eq('user_id', user.id),
      supabase.from('warmup_sessions').select('total_darts, hits, accuracy').eq('user_id', user.id),
    ])

    const gameStats = gameSessions?.length
      ? {
          sessions:       gameSessions.length,
          totalCorrect:   gameSessions.reduce((s, r) => s + r.correct_count, 0),
          totalQuestions: gameSessions.reduce((s, r) => s + r.total_questions, 0),
          bestStreak:     Math.max(...gameSessions.map(r => r.best_streak ?? 0)),
        }
      : null

    const warmupStats = warmupSessions?.length
      ? {
          sessions:    warmupSessions.length,
          totalDarts:  warmupSessions.reduce((s, r) => s + r.total_darts, 0),
          totalHits:   warmupSessions.reduce((s, r) => s + r.hits, 0),
          avgAccuracy: Math.round(
            warmupSessions.reduce((s, r) => s + Number(r.accuracy), 0) / warmupSessions.length
          ),
        }
      : null

    return { gameStats, warmupStats }
  }

  // ── Tournois ────────────────────────────────────────────────────────────

  async function createTournamentRecord({ name, description, startScore, legsToWin }) {
    const user = getUser()
    if (!user) return null
    const { data, error } = await supabase.from('tournaments').insert({
      user_id:     user.id,
      name,
      description: description || null,
      start_score: startScore,
      legs_to_win: legsToWin,
    }).select().single()
    if (error) {
      console.error('[dbStore] createTournamentRecord:', error.message)
      return null
    }
    return data
  }

  async function createTournamentParticipants(tournamentId, participants) {
    const rows = participants.map(p => ({
      tournament_id:    tournamentId,
      seed:             p.seed ?? null,
      user_id:          p.userId ?? null,
      player_data:      p.playerData,
      linked_friend_id: p.linkedFriendId ?? null,
    }))
    const { data, error } = await supabase.from('tournament_participants').insert(rows).select()
    if (error) {
      console.error('[dbStore] createTournamentParticipants:', error.message)
      return []
    }
    return data
  }

  async function addGuestParticipant(tournamentId, participant) {
    return createTournamentParticipants(tournamentId, [participant])
  }

  async function assignParticipantSeeds(updates) {
    const results = await Promise.all(
      updates.map(u => supabase.from('tournament_participants').update({ seed: u.seed }).eq('id', u.id))
    )
    const failed = results.find(r => r.error)
    if (failed) console.error('[dbStore] assignParticipantSeeds:', failed.error.message)
  }

  async function leaveTournament(tournamentId) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('tournament_participants')
      .delete().eq('tournament_id', tournamentId).eq('user_id', user.id)
    if (error) console.error('[dbStore] leaveTournament:', error.message)
  }

  async function deleteTournamentParticipant(participantId) {
    const { error } = await supabase.from('tournament_participants').delete().eq('id', participantId)
    if (error) console.error('[dbStore] deleteTournamentParticipant:', error.message)
  }

  async function deleteTournament(tournamentId) {
    const { error } = await supabase.from('tournaments').delete().eq('id', tournamentId)
    if (error) console.error('[dbStore] deleteTournament:', error.message)
    return !error
  }

  async function addTournamentHost(tournamentId, userId, role = 'host') {
    const { error } = await supabase.from('tournament_hosts').insert({ tournament_id: tournamentId, user_id: userId, role })
    if (error) console.error('[dbStore] addTournamentHost:', error.message)
  }

  async function removeTournamentHost(tournamentId, userId) {
    const { error } = await supabase.from('tournament_hosts')
      .delete().eq('tournament_id', tournamentId).eq('user_id', userId)
    if (error) console.error('[dbStore] removeTournamentHost:', error.message)
  }

  async function fetchTournamentHosts(tournamentId) {
    const { data, error } = await supabase.from('tournament_hosts').select('*').eq('tournament_id', tournamentId)
    if (error) return []
    return data
  }

  async function fetchMyParticipantTournamentIds() {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase.from('tournament_participants').select('tournament_id').eq('user_id', user.id)
    if (error) return []
    return data.map(r => r.tournament_id)
  }

  async function findTournamentByCode(code) {
    const { data, error } = await supabase.rpc('find_tournament_by_join_code', { code })
    if (error) {
      console.error('[dbStore] findTournamentByCode:', error.message)
      return null
    }
    return data?.[0] ?? null
  }

  async function joinTournamentByCode(code) {
    const { data, error } = await supabase.rpc('join_tournament_by_code', { code })
    if (error) {
      console.error('[dbStore] joinTournamentByCode:', error.message)
      return null
    }
    return data
  }

  async function createTournamentMatches(tournamentId, matches) {
    const rows = matches.map(m => ({
      tournament_id:          tournamentId,
      round:                  m.round,
      bracket_type:           m.bracketType,
      slot_in_round:          m.slotInRound,
      player1_participant_id: m.player1ParticipantId,
      player2_participant_id: m.player2ParticipantId,
      winner_participant_id:  m.winnerParticipantId,
      status:                 m.status,
      played_at:              m.status === 'bye' ? new Date().toISOString() : null,
    }))
    const { data, error } = await supabase.from('tournament_matches').insert(rows).select()
    if (error) {
      console.error('[dbStore] createTournamentMatches:', error.message)
      return []
    }
    return data
  }

  async function updateTournamentMatchPointers(updates) {
    const results = await Promise.all(updates.map(u => {
      const { id, ...fields } = u
      return supabase.from('tournament_matches').update(fields).eq('id', id)
    }))
    const failed = results.find(r => r.error)
    if (failed) console.error('[dbStore] updateTournamentMatchPointers:', failed.error.message)
  }

  async function fetchTournaments(limit = 20) {
    const user = getUser()
    if (!user) return []
    // Pas de filtre user_id : la RLS ne renvoie déjà que les tournois où
    // l'utilisateur est hôte ou participant (auto-inscrit ou ajouté).
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async function fetchActiveTournaments(limit = 3) {
    const user = getUser()
    if (!user) return []
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data
  }

  async function fetchTournamentDetail(tournamentId) {
    const [
      { data: tournament, error: tError },
      { data: hosts, error: hError },
      { data: participants, error: pError },
      { data: matches, error: mError },
    ] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', tournamentId).single(),
      supabase.from('tournament_hosts').select('*').eq('tournament_id', tournamentId),
      supabase.from('tournament_participants').select('*').eq('tournament_id', tournamentId).order('seed', { ascending: true, nullsFirst: false }),
      supabase.from('tournament_matches').select('*').eq('tournament_id', tournamentId).order('round', { ascending: true }),
    ])
    if (tError) {
      console.error('[dbStore] fetchTournamentDetail:', tError.message)
      return null
    }
    if (hError) console.error('[dbStore] fetchTournamentDetail (hosts):', hError.message)
    if (pError) console.error('[dbStore] fetchTournamentDetail (participants):', pError.message)
    if (mError) console.error('[dbStore] fetchTournamentDetail (matches):', mError.message)
    return { tournament, hosts: hosts ?? [], participants: participants ?? [], matches: matches ?? [] }
  }

  async function updateTournamentMatch(matchId, fields) {
    const { data, error } = await supabase.from('tournament_matches').update(fields).eq('id', matchId).select().single()
    if (error) {
      console.error('[dbStore] updateTournamentMatch:', error.message)
      return null
    }
    return data
  }

  async function updateTournament(tournamentId, fields) {
    const { error } = await supabase.from('tournaments').update(fields).eq('id', tournamentId)
    if (error) console.error('[dbStore] updateTournament:', error.message)
  }

  return {
    saveGameSession, saveWarmupSession, saveX01Session, saveTacticsSession,
    deleteGameSession, deleteWarmupSession, deleteX01Session, deleteTacticsSession,
    fetchGameSessions, fetchWarmupSessions, fetchWarmupSessionsForChart, fetchX01Sessions, fetchTacticsSessions,
    fetchProfileStats, fetchGlobalStats,
    createTournamentRecord, createTournamentParticipants, createTournamentMatches,
    updateTournamentMatchPointers, fetchTournaments, fetchActiveTournaments, fetchTournamentDetail,
    updateTournamentMatch, updateTournament,
    addGuestParticipant, assignParticipantSeeds, leaveTournament, deleteTournamentParticipant, deleteTournament,
    addTournamentHost, removeTournamentHost, fetchTournamentHosts,
    findTournamentByCode, joinTournamentByCode, fetchMyParticipantTournamentIds,
  }
})
