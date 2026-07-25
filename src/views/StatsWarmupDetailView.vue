<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDbStore } from '../store/dbStore.js'
import { formatZoneLabel } from '../composables/useWarmup.js'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import AppTabs from '../components/AppTabs.vue'
import StatCell from '../components/StatCell.vue'
import WarmupAccuracyChart from '../components/stats/WarmupAccuracyChart.vue'
import StatsSessionDetail from '../components/stats/StatsSessionDetail.vue'

const props = defineProps({
  mockSessions: { type: Array, default: null },
})

const isMock = computed(() => props.mockSessions !== null)

const router = useRouter()
const dbStore = useDbStore()

const allSessions = ref([])
const loading = ref(true)
const selectedPeriod = ref('all') // 'all' | year as string | 'month'
const selectedMonth = ref(null)   // 'YYYY-MM'
const selectedZones = ref([])     // [`${type}-${sector}`, ...]

onMounted(async () => {
  allSessions.value = isMock.value
    ? props.mockSessions
    : await dbStore.fetchWarmupSessionsForChart()
  loading.value = false
})

const availableYears = computed(() => [...new Set(
  allSessions.value.map(s => new Date(s.played_at).getFullYear())
)].sort((a, b) => b - a))

const periodTabs = computed(() => [
  { id: 'all', label: 'Tout' },
  ...availableYears.value.map(y => ({ id: String(y), label: String(y) })),
  { id: 'month', label: 'Mois' },
])

function monthKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

const monthOptions = computed(() => {
  const map = new Map()
  allSessions.value.forEach(s => {
    const key = monthKey(s.played_at)
    if (!map.has(key)) {
      const d = new Date(s.played_at)
      const label = capitalize(new Date(d.getFullYear(), d.getMonth(), 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }))
      map.set(key, { key, label })
    }
  })
  return [...map.values()].sort((a, b) => b.key.localeCompare(a.key))
})

// Sélectionne par défaut le mois le plus récent disponible quand on bascule sur l'onglet "Mois"
watch(selectedPeriod, (val) => {
  if (val === 'month' && !selectedMonth.value && monthOptions.value.length) {
    selectedMonth.value = monthOptions.value[0].key
  }
})

const periodFilteredSessions = computed(() => {
  if (selectedPeriod.value === 'all') return allSessions.value
  if (selectedPeriod.value === 'month') {
    if (!selectedMonth.value) return []
    return allSessions.value.filter(s => monthKey(s.played_at) === selectedMonth.value)
  }
  return allSessions.value.filter(s => new Date(s.played_at).getFullYear() === Number(selectedPeriod.value))
})

function zoneKey(zone) {
  return `${zone.type}-${zone.sector}`
}

const TYPE_ORDER = { S: 0, D: 1, T: 2, A: 3, SB: 4, B: 5, AB: 6 }
const ZONE_COLORS = ['#1D4ED8', '#EB6343', '#36cc86', '#F4C430', '#A855F7', '#EC4899', '#14B8A6', '#F97316']

const zoneOptions = computed(() => {
  const map = new Map()
  allSessions.value.forEach(s => {
    const recap = s.settings?.zoneRecap
    if (!Array.isArray(recap)) return
    recap.forEach(zs => {
      zs.zones.forEach(z => {
        const key = zoneKey(z)
        if (!map.has(key)) map.set(key, { key, label: formatZoneLabel(z), zone: z })
      })
    })
  })
  return [...map.values()].sort((a, b) =>
    (TYPE_ORDER[a.zone.type] ?? 9) - (TYPE_ORDER[b.zone.type] ?? 9) || (a.zone.sector ?? 0) - (b.zone.sector ?? 0)
  ).map((z, i) => ({ ...z, color: ZONE_COLORS[i % ZONE_COLORS.length] }))
})

const ZONE_CATEGORIES = [
  { id: 'simple', label: 'Simple', types: ['S'] },
  { id: 'double', label: 'Double', types: ['D'] },
  { id: 'triple', label: 'Triple', types: ['T'] },
  { id: 'other', label: 'Autres', types: ['A', 'B', 'SB', 'AB'] },
]

// Une ligne par catégorie (simple/double/triple/autres), affichée seulement si elle a des zones jouées
const zoneCategories = computed(() =>
  ZONE_CATEGORIES
    .map(cat => ({ ...cat, zones: zoneOptions.value.filter(z => cat.types.includes(z.zone.type)) }))
    .filter(cat => cat.zones.length > 0)
)

function toggleZone(key) {
  selectedZones.value = selectedZones.value.includes(key)
    ? selectedZones.value.filter(k => k !== key)
    : [...selectedZones.value, key]
}

function isCategoryFullySelected(cat) {
  return cat.zones.every(z => selectedZones.value.includes(z.key))
}

function toggleCategoryAll(cat) {
  const keys = cat.zones.map(z => z.key)
  selectedZones.value = isCategoryFullySelected(cat)
    ? selectedZones.value.filter(k => !keys.includes(k))
    : [...new Set([...selectedZones.value, ...keys])]
}

function clearZones() {
  selectedZones.value = []
}

// Périodes d'une session dont la cible incluait la zone choisie (seule ou combinée à d'autres)
function matchingZoneRecap(session, key) {
  const recap = session.settings?.zoneRecap
  if (!Array.isArray(recap)) return []
  return recap.filter(zs => zs.zones.some(z => zoneKey(z) === key))
}

// Précision agrégée (pondérée par fléchettes) sur la zone choisie pour une session
function sessionZoneStats(session, key) {
  const periods = matchingZoneRecap(session, key)
  const total = periods.reduce((sum, zs) => sum + zs.total, 0)
  const hits = periods.reduce((sum, zs) => sum + zs.hits, 0)
  return { total, hits, accuracy: total > 0 ? Math.round((hits / total) * 100) : 0 }
}

function dayKey(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Regroupe des sessions (déjà annotées displayAccuracy/secondaryAccuracy) en points, un par jour
// (moyenne des moyennes de précision des sessions du même jour).
function groupByDay(sessions) {
  const groups = new Map()
  sessions.forEach(s => {
    const key = dayKey(s.played_at)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  })
  return [...groups.values()].map(group => ({
    id: dayKey(group[0].played_at),
    played_at: group[0].played_at,
    accuracy: Math.round(group.reduce((acc, s) => acc + s.displayAccuracy, 0) / group.length),
    secondaryAccuracy: null,
    sessions: group,
  }))
}

// Une courbe par zone sélectionnée ; sans sélection, une seule courbe "Toutes zones".
const chartSeries = computed(() => {
  const base = periodFilteredSessions.value

  if (!selectedZones.value.length) {
    const withDisplay = base.map(s => ({ ...s, displayAccuracy: Number(s.accuracy), secondaryAccuracy: null }))
    return [{ key: 'all', label: 'Toutes zones', color: '#1D4ED8', points: groupByDay(withDisplay) }]
  }

  return selectedZones.value.map(key => {
    const matching = base.filter(s => matchingZoneRecap(s, key).length > 0)
    const withDisplay = matching.map(s => {
      const zs = sessionZoneStats(s, key)
      return { ...s, displayAccuracy: zs.accuracy, secondaryAccuracy: Number(s.accuracy) }
    })
    const zoneOpt = zoneOptions.value.find(z => z.key === key)
    return { key, label: zoneOpt?.label ?? key, color: zoneOpt?.color ?? '#1D4ED8', points: groupByDay(withDisplay) }
  })
})

const hasChartData = computed(() => chartSeries.value.some(s => s.points.length > 0))

const selectedSession = ref(null)
const showDetail = ref(false)

function openSession(session) {
  selectedSession.value = session
  showDetail.value = true
}

async function deleteSession(id) {
  if (!isMock.value) await dbStore.deleteWarmupSession(id)
  allSessions.value = allSessions.value.filter(s => s.id !== id)
  showDetail.value = false
}

// Résumé global de la période — utilisé seulement quand aucune zone n'est sélectionnée
const periodSummary = computed(() => {
  const s = periodFilteredSessions.value
  if (!s.length) return null
  return {
    sessions: s.length,
    avgAccuracy: Math.round(s.reduce((acc, r) => acc + Number(r.accuracy), 0) / s.length),
    bestAccuracy: Math.max(...s.map(r => Number(r.accuracy))),
  }
})

// Un résumé par zone sélectionnée, pour coller à ce qui est affiché sur le graphique
const zoneSummaries = computed(() => selectedZones.value.map(key => {
  const zoneOpt = zoneOptions.value.find(z => z.key === key)
  const matching = periodFilteredSessions.value.filter(s => matchingZoneRecap(s, key).length > 0)
  const stats = matching.map(s => sessionZoneStats(s, key))
  const totalDarts = stats.reduce((acc, z) => acc + z.total, 0)
  const totalHits = stats.reduce((acc, z) => acc + z.hits, 0)
  return {
    key,
    label: zoneOpt?.label ?? key,
    color: zoneOpt?.color ?? '#1D4ED8',
    sessions: matching.length,
    avgAccuracy: totalDarts > 0 ? Math.round((totalHits / totalDarts) * 100) : 0,
    bestAccuracy: stats.length ? Math.max(...stats.map(z => z.accuracy)) : 0,
  }
}))
</script>

<template>
  <div class="warmup-detail">
    <AppHeader title="ÉCHAUFFEMENT — DÉTAIL" @back="router.back()" />

    <main class="warmup-detail__main">
      <div v-if="loading" class="warmup-detail__empty">Chargement…</div>

      <template v-else-if="allSessions.length">
        <div class="warmup-detail__filters">
          <AppTabs :tabs="periodTabs" v-model="selectedPeriod" />
        </div>

        <div v-if="selectedPeriod === 'month'" class="warmup-detail__month-filter">
          <select class="warmup-detail__month-select" v-model="selectedMonth">
            <option v-for="m in monthOptions" :key="m.key" :value="m.key">{{ m.label }}</option>
          </select>
        </div>

        <div v-if="zoneCategories.length" class="warmup-detail__zones">
          <div v-for="cat in zoneCategories" :key="cat.id" class="warmup-detail__zone-row">
            <span class="warmup-detail__zone-row-label">{{ cat.label }}</span>
            <div class="warmup-detail__zone-chips">
              <button
                class="warmup-detail__zone-chip warmup-detail__zone-chip--all"
                :class="{ 'warmup-detail__zone-chip--active': isCategoryFullySelected(cat) }"
                @click="toggleCategoryAll(cat)"
              >
                Tout
              </button>
              <button
                v-for="z in cat.zones" :key="z.key"
                class="warmup-detail__zone-chip"
                :class="{ 'warmup-detail__zone-chip--active': selectedZones.includes(z.key) }"
                :style="selectedZones.includes(z.key) ? { '--chip-color': z.color } : {}"
                @click="toggleZone(z.key)"
              >
                {{ z.label }}
              </button>
            </div>
          </div>

          <button v-if="selectedZones.length" class="warmup-detail__zone-clear" @click="clearZones">
            <AppIcon name="eraser" :width="14" :height="14" />
            Tout désélectionner
          </button>
        </div>

        <section v-if="hasChartData" class="warmup-detail__chart-card">
          <WarmupAccuracyChart :series="chartSeries" :period-mode="selectedPeriod === 'month' ? 'month' : 'default'" @open-session="openSession" />
        </section>

        <section v-if="!selectedZones.length && periodSummary" class="warmup-detail__grid">
          <StatCell :value="periodSummary.sessions" label="Sessions" />
          <StatCell :value="periodSummary.avgAccuracy + '%'" label="Précision moy." />
          <StatCell :value="periodSummary.bestAccuracy + '%'" label="Meilleure séance" />
        </section>

        <section v-for="zs in zoneSummaries" :key="zs.key" class="warmup-detail__zone-summary">
          <div class="warmup-detail__zone-summary-label">
            <span class="warmup-detail__zone-summary-dot" :style="{ background: zs.color }" />
            {{ zs.label }}
          </div>
          <div class="warmup-detail__grid">
            <StatCell :value="zs.sessions" label="Sessions" />
            <StatCell :value="zs.avgAccuracy + '%'" label="Précision moy." />
            <StatCell :value="zs.bestAccuracy + '%'" label="Meilleure séance" />
          </div>
        </section>

        <p v-if="!periodFilteredSessions.length" class="warmup-detail__empty">
          Aucune session d'échauffement pour cette période.
        </p>
      </template>

      <p v-else class="warmup-detail__empty">
        Lance une session d'échauffement pour voir tes stats ici.
      </p>
    </main>

    <StatsSessionDetail
      :show="showDetail"
      :session="selectedSession"
      mode="warmup"
      @close="showDetail = false"
      @delete="deleteSession"
    />
  </div>
</template>

<style lang="scss" scoped>
.warmup-detail {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__filters {
    overflow-x: auto;

    :deep(.app-tabs) {
      width: max-content;
      min-width: 100%;
    }

    :deep(.app-tabs__tab) {
      flex: 1;
      padding-left: $padding-md;
      padding-right: $padding-md;
    }
  }

  &__month-filter {
    display: flex;
  }

  &__month-select {
    flex: 1;
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    padding: $padding-xs $padding-sm;
    color: $text-color;
    @include text-sm;
  }

  &__zones {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__zone-row {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__zone-row-label {
    @include text-xs;
    color: $muted;
    flex-shrink: 0;
    width: 44px;
  }

  &__zone-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;
    overflow-x: auto;
  }

  &__zone-chip {
    background: rgba($white, 0.05);
    border-radius: $radius-sm;
    padding: $padding-xxs $padding-sm;
    color: $muted;
    @include text-xs;
    font-weight: 600;
    flex-shrink: 0;
    transition: background 0.15s, color 0.15s;

    &--active {
      background: var(--chip-color, $blue);
      color: $white;
    }

    &--all.warmup-detail__zone-chip--active {
      background: $orange;
    }
  }

  &__zone-clear {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    align-self: flex-start;
    background: $error;
    border-radius: $radius-sm;
    padding: $padding-xxs $padding-sm;
    color: $white;
    @include text-xs;
    font-weight: 600;
    transition: opacity 0.15s;

    &:active { opacity: 0.6; }
  }

  &__chart-card {
    background: rgba($white, 0.05);
    border-radius: $radius-lg;
    padding: $padding-md;
  }

  &__grid {
    display: grid;
    gap: $gap-sm;
    grid-template-columns: repeat(3, 1fr);
  }

  &__zone-summary {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__zone-summary-label {
    display: flex;
    align-items: center;
    gap: $gap-xxs;
    @include text-xs;
    color: $muted;
    font-weight: 600;
  }

  &__zone-summary-dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    flex-shrink: 0;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    margin-top: $gap-xxl;
  }
}

@media (min-width: $bp-laptop) {
  .warmup-detail {
    padding: $padding-xxl;

    &__month-select { @include text-md; }
    &__zone-row-label { @include text-sm; }
    &__zone-chip { @include text-sm; }
    &__zone-clear { @include text-sm; }
    &__zone-summary-label { @include text-sm; }
    &__chart-card { padding: $padding-xl; }
    &__empty { @include text-md; }
  }
}
</style>
