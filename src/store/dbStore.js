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
  async function saveX01Session({ startScore, legsPlayed, stats, settings }) {
    const user = getUser()
    if (!user) return
    const { error } = await supabase.from('x01_sessions').insert({
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
    })
    if (error) console.error('[dbStore] saveX01Session:', error.message)
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
      .select('*')
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

  return {
    saveGameSession, saveWarmupSession, saveX01Session,
    deleteGameSession, deleteWarmupSession, deleteX01Session,
    fetchGameSessions, fetchWarmupSessions, fetchWarmupSessionsForChart, fetchX01Sessions,
    fetchProfileStats, fetchGlobalStats,
  }
})
