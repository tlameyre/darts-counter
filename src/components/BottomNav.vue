<script setup>
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { useRoute } from 'vue-router'
import { useFriendStore } from '../store/friendStore.js'
import { useTournamentStore } from '../store/tournamentStore.js'

const route           = useRoute()
const friendStore     = useFriendStore()
const tournamentStore = useTournamentStore()

const tabs = [
  { name: 'home',        label: 'Accueil',  icon: 'home' },
  { name: 'play',        label: 'Jouer',    icon: 'dartboard' },
  { name: 'tournaments', label: 'Tournoi',  icon: 'trophy' },
  { name: 'stats',       label: 'Stats',    icon: 'chart' },
  { name: 'profile',     label: 'Profil',   icon: 'user' },
]

// L'onglet profil est actif sur /profile, /profile/edit et /profile/badges
const profileRoutes = new Set(['profile', 'profile-edit', 'badges'])

// L'onglet tournoi reste actif sur toutes les sous-vues du mode tournoi
const tournamentRoutes = new Set(['tournaments', 'tournament-settings', 'tournament-detail', 'tournament-join'])

const pendingCount        = computed(() => friendStore.pendingReceived.length)
const unseenTournamentCount = computed(() => tournamentStore.unseenTournamentCount)
</script>

<template>
  <nav class="bottom-nav">
    <router-link
      v-for="tab in tabs"
      :key="tab.name"
      :to="{ name: tab.name }"
      class="bottom-nav__tab"
      :class="{
        'bottom-nav__tab--active':
          tab.name === 'profile' ? profileRoutes.has(route.name)
          : tab.name === 'tournaments' ? tournamentRoutes.has(route.name)
          : route.name === tab.name
      }"
    >
      <div class="bottom-nav__icon-wrap">
        <AppIcon :name="tab.icon" :width="24" :height="24" />
        <span v-if="tab.name === 'profile' && pendingCount" class="bottom-nav__dot" />
        <span v-if="tab.name === 'tournaments' && unseenTournamentCount" class="bottom-nav__dot" />
      </div>
      <span class="bottom-nav__label">{{ tab.label }}</span>
    </router-link>
  </nav>
</template>

<style lang="scss" scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  border-top: 2px solid $white;
  display: flex;
  align-items: stretch;
  z-index: 50;
  padding-bottom: env(safe-area-inset-bottom);
  background: $bg;

  &__tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: $padding-sm 0;
    gap: $gap-xxs;
    color: $white;
    text-decoration: none;
    transition: color 0.15s;

    &--active { color: $orange; }
  }

  &__icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__dot {
    position: absolute;
    top: -2px;
    right: -4px;
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: $orange;
    border: 1.5px solid $bg;
  }

  &__label {
    @include title-xs;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}
</style>
