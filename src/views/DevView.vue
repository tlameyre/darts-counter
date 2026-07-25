<script setup>
/**
 * Playground de développement — accessible uniquement via /dev en mode dev.
 * Permet d'afficher chaque composant conditionnel (overlays, modals, écrans)
 * avec des données factices, sans remplir les conditions réelles.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { BADGES } from '../data/badges.js'

import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import GameOver from '../components/GameOver.vue'
import GameMenuModal from '../components/game/GameMenuModal.vue'
import ChangeEmailModal from '../components/profile/ChangeEmailModal.vue'
import ChangePasswordModal from '../components/profile/ChangePasswordModal.vue'
import X01DoublesModal from '../components/x01/X01DoublesModal.vue'
import X01CheckoutModal from '../components/x01/X01CheckoutModal.vue'
import FriendsView from './FriendsView.vue'
import StatsWarmupDetailView from './StatsWarmupDetailView.vue'

const router = useRouter()

// --- Preview FriendsView ---
const showFriendsPreview = ref(false)

// --- Preview StatsWarmupDetailView ---
const showWarmupDetailPreview = ref(false)
const D16 = { sector: 16, type: 'D' }
const T20 = { sector: 20, type: 'T' }
const mockWarmupSessions = [
  { id: '1', played_at: '2025-11-02T10:00:00Z', accuracy: 55, total_darts: 20, hits: 11, duration_s: 300, settings: { zoneRecap: [{ zones: [D16], total: 20, hits: 9, accuracy: 45, durationMs: 300000 }] } },
  { id: '2', played_at: '2026-01-05T10:00:00Z', accuracy: 62, total_darts: 40, hits: 25, duration_s: 480, settings: { zoneRecap: [{ zones: [D16], total: 20, hits: 12, accuracy: 60, durationMs: 240000 }, { zones: [T20], total: 20, hits: 13, accuracy: 65, durationMs: 240000 }] } },
  { id: '3', played_at: '2026-02-12T10:00:00Z', accuracy: 68, total_darts: 30, hits: 21, duration_s: 360, settings: { zoneRecap: [{ zones: [T20], total: 30, hits: 21, accuracy: 70, durationMs: 360000 }] } },
  { id: '4', played_at: '2026-03-20T10:00:00Z', accuracy: 71, total_darts: 30, hits: 21, duration_s: 360, settings: { zoneRecap: [{ zones: [D16], total: 30, hits: 21, accuracy: 70, durationMs: 360000 }] } },
  { id: '5', played_at: '2026-07-01T09:00:00Z', accuracy: 80, total_darts: 40, hits: 33, duration_s: 420, settings: { zoneRecap: [{ zones: [D16, T20], total: 40, hits: 33, accuracy: 82, durationMs: 420000 }] } },
  { id: '6', played_at: '2026-07-01T18:30:00Z', accuracy: 58, total_darts: 25, hits: 15, duration_s: 300, settings: { zoneRecap: [{ zones: [T20], total: 25, hits: 15, accuracy: 60, durationMs: 300000 }] } },
]

// --- Overlays / modals ---
const unlockBadges        = ref([])
const showBadgeDetail     = ref(false)
const badgeDetail         = ref(null)
const badgeProgress       = ref(null)
const showGameOver        = ref(false)
const showGameMenu        = ref(false)
const showEmailModal      = ref(false)
const showPasswordModal   = ref(false)
const showDoublesModal    = ref(false)
const showCheckoutModal   = ref(false)

// Mock data
const mockBadge = { ...BADGES[0], unlockedAt: new Date().toISOString() }
const mockLockedBadge = BADGES.find(b => b.id === 'darts_1000') ?? BADGES[6]
const mockProgress = { current: 430, target: 1000, suffix: '' }

function showUnlockOne() {
  unlockBadges.value = [BADGES[0]]
}
function showUnlockMany() {
  unlockBadges.value = BADGES.slice(0, 3)
}
function openBadgeUnlocked() {
  badgeDetail.value   = mockBadge
  badgeProgress.value = null
  showBadgeDetail.value = true
}
function openBadgeLocked() {
  badgeDetail.value   = { ...mockLockedBadge, unlockedAt: null }
  badgeProgress.value = mockProgress
  showBadgeDetail.value = true
}

// --- Vues plein écran ---
const views = [
  { name: 'home',           label: 'Home' },
  { name: 'play',           label: 'Lobby (Jouer)' },
  { name: 'stats',          label: 'Stats' },
  { name: 'stats-warmup-detail', label: 'Stats — Détail échauffement' },
  { name: 'profile',        label: 'Profil' },
  { name: 'profile-edit',   label: 'Édition profil' },
  { name: 'badges',         label: 'Badges' },
  { name: 'friends',        label: 'Amis' },
  { name: 'score-settings', label: 'Réglages Score' },
  { name: 'warmup-settings',label: 'Réglages Warmup' },
  { name: 'x01-settings',  label: 'Réglages 501' },
  { name: 'x01-game',      label: 'Partie 501' },
  { name: 'login',          label: 'Login' },
  { name: 'register',       label: 'Register' },
]

// --- Mock data FriendsView ---
const mockFriends = [
  { friendshipId: '1', id: 'u1', first_name: 'Lucas',  username: 'luca92',   friend_code: 'DMC-A4X7' },
  { friendshipId: '2', id: 'u2', first_name: null,      username: 'dartking', friend_code: 'DMC-B8K2' },
]
const mockReceived = [
  { friendshipId: '3', id: 'u3', first_name: 'Emma',   username: 'emma_d',   friend_code: 'DMC-C1Z9' },
]
const mockSent = [
  { friendshipId: '4', id: 'u4', first_name: null,      username: 'pro180',   friend_code: 'DMC-D5P3' },
]
</script>

<template>
  <div class="dev">
    <h1 class="dev__title">🛠 Dev Playground</h1>

    <!-- Overlays / Modals -->
    <section class="dev__section">
      <h2 class="dev__section-title">Overlays & Modals</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showUnlockOne">Badge débloqué (1)</button>
        <button class="dev__btn" @click="showUnlockMany">Badges débloqués (3)</button>
        <button class="dev__btn" @click="openBadgeUnlocked">Détail badge (débloqué)</button>
        <button class="dev__btn" @click="openBadgeLocked">Détail badge (verrouillé + progression)</button>
        <button class="dev__btn" @click="showGameOver = true">Game Over</button>
        <button class="dev__btn" @click="showGameMenu = true">Menu de partie</button>
        <button class="dev__btn" @click="showEmailModal = true">Changer email</button>
        <button class="dev__btn" @click="showPasswordModal = true">Changer mot de passe</button>
        <button class="dev__btn" @click="showDoublesModal = true">X01 — Doubles tentés</button>
        <button class="dev__btn" @click="showCheckoutModal = true">X01 — Checkout</button>
      </div>
    </section>

    <!-- Vues -->
    <section class="dev__section">
      <h2 class="dev__section-title">Vues</h2>
      <div class="dev__buttons">
        <button
          v-for="v in views"
          :key="v.name"
          class="dev__btn"
          @click="router.push({ name: v.name })"
        >
          {{ v.label }}
        </button>
      </div>
    </section>

    <!-- FriendsView — aperçu plein écran avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">Vue Amis (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showFriendsPreview = true">Ouvrir la vue Amis</button>
      </div>
    </section>

    <!-- StatsWarmupDetailView — aperçu plein écran avec données fictives -->
    <section class="dev__section">
      <h2 class="dev__section-title">Stats — Détail échauffement (preview)</h2>
      <div class="dev__buttons">
        <button class="dev__btn" @click="showWarmupDetailPreview = true">Ouvrir la vue Détail échauffement</button>
      </div>
    </section>

    <!-- Game Over en aperçu (a besoin d'un conteneur) -->
    <div v-if="showGameOver" class="dev__gameover-preview">
      <GameOver :correct-count="14" :max-questions="20" :best="9"
        @replay="showGameOver = false" @home="showGameOver = false" />
    </div>

    <!-- Composants montés -->
    <BadgeUnlockOverlay :badges="unlockBadges" @done="unlockBadges = []" />
    <BadgeDetailModal :show="showBadgeDetail" :badge="badgeDetail" :progress="badgeProgress"
      @close="showBadgeDetail = false" />
    <GameMenuModal :show="showGameMenu" @close="showGameMenu = false"
      @finish="showGameMenu = false" @quit="showGameMenu = false" />
    <ChangeEmailModal :show="showEmailModal" current-email="test@exemple.com"
      @close="showEmailModal = false" @save="showEmailModal = false" />
    <ChangePasswordModal :show="showPasswordModal"
      @close="showPasswordModal = false" @save="showPasswordModal = false" />
    <X01DoublesModal :show="showDoublesModal" @confirm="showDoublesModal = false" />
    <X01CheckoutModal :show="showCheckoutModal" :default-darts="2" :checkout-score="40"
      @confirm="showCheckoutModal = false" />

    <!-- FriendsView plein écran -->
    <div v-if="showFriendsPreview" class="dev__fullscreen-preview">
      <FriendsView
        :mock-friends="mockFriends"
        :mock-received="mockReceived"
        :mock-sent="mockSent"
        :mock-friend-code="'DMC-X7K2'"
      />
      <button class="dev__close-preview" @click="showFriendsPreview = false">✕ Fermer</button>
    </div>

    <!-- StatsWarmupDetailView plein écran -->
    <div v-if="showWarmupDetailPreview" class="dev__fullscreen-preview">
      <StatsWarmupDetailView :mock-sessions="mockWarmupSessions" />
      <button class="dev__close-preview" @click="showWarmupDetailPreview = false">✕ Fermer</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dev {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-xl;

  &__title {
    @include title-xl;
    color: $text-color;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: $gap-xs;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__buttons {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__btn {
    background: rgba(255, 255, 255, 0.06);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    color: $text-color;
    @include text-sm;
    text-align: left;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.12); }
  }

  &__gameover-preview {
    position: fixed;
    inset: 0;
    background: $bg;
    padding: $padding-md;
    display: flex;
    flex-direction: column;
    z-index: 90;
  }

  &__fullscreen-preview {
    position: fixed;
    inset: 0;
    background: $bg;
    overflow-y: auto;
    z-index: 90;
  }

  &__close-preview {
    @include title-sm;
    position: fixed;
    bottom: calc($padding-lg + env(safe-area-inset-bottom));
    right: $padding-md;
    background: $orange;
    color: $white;
    padding: $padding-sm $padding-md;
    border-radius: $radius-pill;
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }
}
</style>
