<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useTournamentStore } from '../store/tournamentStore.js'
import { GAME_MODES } from '../data/gameModes.js'
import AppIcon from '../components/AppIcon.vue'
import RecentBadges from '../components/RecentBadges.vue'
import ActiveTournaments from '../components/ActiveTournaments.vue'

const router          = useRouter()
const authStore       = useAuthStore()
const badgeStore      = useBadgeStore()
const tournamentStore = useTournamentStore()
const userBadges      = ref([])
const activeTournaments = ref([])

onMounted(async () => {
  userBadges.value        = await badgeStore.fetchUserBadges()
  activeTournaments.value = await tournamentStore.fetchActiveTournaments()
})

const displayName = computed(() => {
  const p = authStore.profile
  if (!p) return 'Joueur'
  return p.first_name || p.username || 'Joueur'
})

const initials = computed(() => {
  const p = authStore.profile
  if (!p) return '?'
  if (p.first_name || p.last_name) {
    return [(p.first_name?.[0] ?? ''), (p.last_name?.[0] ?? '')].join('').toUpperCase()
  }
  return (p.username?.[0] ?? authStore.user?.email?.[0] ?? '?').toUpperCase()
})

const trainModes = computed(() => GAME_MODES.filter((m) => m.group === 'train'))
const playModes  = computed(() => GAME_MODES.filter((m) => m.group !== 'train'))
</script>

<template>
  <div class="home">
    <header class="home__header">
      <button class="home__avatar" @click="router.push({ name: 'profile' })">
        {{ initials }}
      </button>
      <div>
        <p class="home__greeting">Bonjour,</p>
        <h1 class="home__name">{{ displayName }}</h1>
      </div>
    </header>

    <main class="home__main">

      <!-- Raccourcis : s'entraîner -->
      <section class="home__section">
        <h2 class="home__section-title">S'entraîner</h2>
        <div class="home__modes">
          <button v-for="mode in trainModes" :key="mode.id" class="home__mode-card"
            :style="{ '--mode-color': mode.color }" @click="router.push({ name: mode.settingsRoute })">
            <AppIcon :name="mode.icon" :width="24" :height="24" class="home__mode-icon" />
            <span class="home__mode-label">{{ mode.title.replace('\n', ' ') }}</span>
          </button>

          <button class="home__mode-card home__mode-card--ghost" @click="router.push({ name: 'checkout-wiki' })">
            <AppIcon name="book" :width="24" :height="24" class="home__mode-icon" />
            <span class="home__mode-label">Checkouts — consulter</span>
          </button>
        </div>
      </section>

      <!-- Raccourcis : jouer -->
      <section class="home__section">
        <h2 class="home__section-title">Jouer</h2>
        <div class="home__modes">
          <button v-for="mode in playModes" :key="mode.id" class="home__mode-card"
            :style="{ '--mode-color': mode.color }" @click="router.push({ name: mode.settingsRoute })">
            <AppIcon :name="mode.icon" :width="24" :height="24" class="home__mode-icon" />
            <span class="home__mode-label">{{ mode.title.replace('\n', ' ') }}</span>
          </button>
        </div>
      </section>

      <!-- Tournois en cours -->
      <ActiveTournaments
        :tournaments="activeTournaments"
        @tournament-click="id => router.push({ name: 'tournament-detail', params: { id } })"
        @view-all="router.push({ name: 'tournaments' })"
      />

      <!-- Badges récents -->
      <RecentBadges
        :badges="userBadges"
        @badge-click="router.push({ name: 'badges' })"
        @view-all="router.push({ name: 'badges' })"
      />

    </main>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-lg $padding-md 0;
  gap: $padding-xl;
  @include nav-safe-bottom;

  &__header {
    padding-top: $padding-lg;
    display: flex;
    align-items: center;
    gap: $gap-md;
  }

  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: $radius-pill;
    background: $orange;
    color: $white;
    @include title-lg;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:active {
      opacity: 0.7;
    }
  }

  &__greeting {
    @include text-sm;
    color: $muted;
  }

  &__name {
    @include title-xxl;
    line-height: 1;
  }

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
  }

  // --- Section ---
  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__section-count {
    color: $orange;
    margin-left: $gap-xs;
  }

  &__section-link {
    @include title-sm;
    color: $orange;
  }

  // --- Modes ---
  &__modes {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $gap-sm;
  }

  &__mode-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-sm;
    min-height: 96px;
    background: var(--mode-color);
    border-radius: $radius-md;
    padding: $padding-md;
    transition: opacity 0.15s;
    color: $white;

    &:active {
      opacity: 0.8;
    }

    &--ghost {
      grid-column: 1 / -1;
      flex-direction: row;
      align-items: center;
      min-height: 0;
      background: rgba($white, 0.05);
      border: $border-sm solid rgba($white, 0.08);
    }
  }

  &__mode-icon {
    color: rgba(255, 255, 255, 0.8);
    flex-shrink: 0;
  }

  &__mode-label {
    @include title-sm;
    color: $white;
    text-align: left;
  }

}

@media (min-width: $bp-laptop) {
  .home {
    padding: $padding-xxl $padding-xxl 0;
    gap: $padding-xxl;
    @include nav-safe-bottom($padding-xl);

    &__header {
      padding-top: 0;
    }

    &__avatar {
      width: 64px;
      height: 64px;
      @include title-xl;
    }

    &__greeting {
      @include text-md;
    }

    &__name {
      @include title-xxxl;
    }

    &__section-title {
      @include title-md;
    }

    &__main {
      gap: $gap-xl;
    }

    &__mode-card {
      gap: $gap-md;
      min-height: 120px;
      padding: $padding-xl;
    }

    &__mode-label {
      @include title-lg;
    }

    &__section-link {
      @include title-lg;
    }

  }
}
</style>
