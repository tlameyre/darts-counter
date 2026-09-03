<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useDbStore } from '../store/dbStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useFriendStore } from '../store/friendStore.js'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'
import ProfileFriendsSection from '../components/friends/ProfileFriendsSection.vue'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppIcon from '../components/AppIcon.vue'
import RecentBadges from '../components/RecentBadges.vue'

const router      = useRouter()
const authStore   = useAuthStore()
const dbStore     = useDbStore()
const badgeStore  = useBadgeStore()
const friendStore = useFriendStore()
const { getBadgeProgress } = badgeStore

const stats          = ref(null)
const userBadges     = ref([])
const selectedBadge  = ref(null)
const showBadgeModal = ref(false)

onMounted(async () => {
  const [s, b] = await Promise.all([
    dbStore.fetchProfileStats(),
    badgeStore.fetchUserBadges(),
    friendStore.fetchFriends(),
  ])
  stats.value      = s
  userBadges.value = b
})

const selectedProgress = computed(() =>
  selectedBadge.value && !selectedBadge.value.unlockedAt
    ? getBadgeProgress(selectedBadge.value.id, stats.value)
    : null
)

function openBadge(badge) {
  selectedBadge.value  = badge
  showBadgeModal.value = true
}

const displayName = computed(() => {
  const p = authStore.profile
  if (!p) return '—'
  const full = [p.first_name, p.last_name].filter(Boolean).join(' ')
  return full || p.username || authStore.user?.email || '—'
})

const initials = computed(() => {
  const p = authStore.profile
  if (!p) return '?'
  if (p.first_name || p.last_name) {
    return [(p.first_name?.[0] ?? ''), (p.last_name?.[0] ?? '')].join('').toUpperCase()
  }
  return (p.username?.[0] ?? authStore.user?.email?.[0] ?? '?').toUpperCase()
})

async function onSignOut() {
  await authStore.signOut()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="profile">
    <AppHeader title="PROFIL" @back="router.push({ name: 'home' })">
      <template #right>
        <button class="profile__edit-btn" @click="router.push({ name: 'profile-edit' })">
          <AppIcon name="pen" :width="18" :height="18" />
        </button>
      </template>
    </AppHeader>

    <main class="profile__main">

      <section class="profile__hero">
        <div class="profile__avatar">
          <span class="profile__avatar-initials">{{ initials }}</span>
        </div>
        <h1 class="profile__name">{{ displayName }}</h1>
        <p v-if="authStore.profile?.username" class="profile__username">{{ authStore.profile.username }}</p>
      </section>

      <section class="profile__stats-card">
        <div class="profile__stat">
          <span class="profile__stat-value">{{ stats?.totalSessions ?? '—' }}</span>
          <span class="profile__stat-label">Parties jouées</span>
        </div>
        <div class="profile__stat-divider" />
        <div class="profile__stat">
          <span class="profile__stat-value">{{ stats?.totalDarts ?? '—' }}</span>
          <span class="profile__stat-label">Fléchettes</span>
        </div>
        <div class="profile__stat-divider" />
        <div class="profile__stat">
          <span class="profile__stat-value">
            {{ stats?.avgAccuracy != null ? stats.avgAccuracy + '%' : '—' }}
          </span>
          <span class="profile__stat-label">Précision</span>
        </div>
      </section>

      <!-- Amis -->
      <ProfileFriendsSection
        :friends="friendStore.friends"
        :pending-count="friendStore.pendingReceived.length"
        @see-all="router.push({ name: 'friends' })"
      />

      <!-- Badges -->
      <RecentBadges
        :badges="userBadges"
        empty-text="Joue ta première partie pour débloquer des badges."
        @badge-click="openBadge"
        @view-all="router.push({ name: 'badges' })"
      />

      <AppButton variant="ghost" class="profile__logout" @click="onSignOut">
        Se déconnecter
      </AppButton>

    </main>

    <BadgeDetailModal
      :show="showBadgeModal"
      :badge="selectedBadge"
      :progress="selectedProgress"
      @close="showBadgeModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.profile {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md;
  gap: $gap-md;

  &__edit-btn {
    color: $text-color;
    display: flex;
    align-items: center;
    padding: $padding-xxs;
    transition: opacity 0.15s;
    &:active { opacity: 0.6; }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    @include nav-safe-bottom;
  }

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xl 0 $padding-md;
  }

  &__avatar {
    width: 88px;
    height: 88px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: $gap-xs;
  }

  &__avatar-initials {
    @include text-xxl;
    font-weight: 600;
    color: $white;
    line-height: 1;
  }

  &__name {
    @include title-xl;
    color: $text-color;
    text-align: center;
  }

  &__username {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  &__stats-card {
    display: flex;
    align-items: stretch;
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-lg;
    padding: $padding-lg $padding-md;
  }

  &__stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-xxs;
  }

  &__stat-divider {
    width: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 0 $gap-xs;
  }

  &__stat-value {
    @include title-xxl;
    color: $text-color;
  }

  &__stat-label {
    @include text-xs;
    color: $muted;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  // --- Logout ---
  &__logout {
    color: $error;
    border-color: rgba($error, 0.3);
  }
}

@media (min-width: $bp-laptop) {
  .profile {
    padding: $padding-xl;
    gap: $gap-lg;

    &__main { gap: $gap-xl; }

    &__hero { gap: $gap-md; padding: $padding-xxl 0 $padding-lg; }

    &__avatar {
      width: 120px;
      height: 120px;
    }

    &__avatar-initials { @include text-xxl; }

    &__name     { @include title-xxl; }
    &__username { @include text-md; }

    &__stats-card { padding: $padding-xl $padding-lg; }
    &__stat-label { @include text-sm; }

  }
}
</style>
