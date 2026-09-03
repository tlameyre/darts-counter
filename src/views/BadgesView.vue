<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BADGES } from '../data/badges.js'
import { useBadgeStore } from '../store/badgeStore.js'
import { useDbStore } from '../store/dbStore.js'
import AppHeader from '../components/AppHeader.vue'
import BadgeDetailModal from '../components/badges/BadgeDetailModal.vue'

const router      = useRouter()
const badgeStore  = useBadgeStore()
const dbStore     = useDbStore()
const { getBadgeProgress } = badgeStore

const userBadges    = ref([])
const stats         = ref(null)
const selectedBadge = ref(null)
const showModal     = ref(false)

onMounted(async () => {
  const [b, s] = await Promise.all([badgeStore.fetchUserBadges(), dbStore.fetchProfileStats()])
  userBadges.value = b
  stats.value      = s
})

// Badge enrichi avec unlockedAt si débloqué
function enrichBadge(badge) {
  const unlocked = userBadges.value.find(b => b.id === badge.id)
  return { ...badge, unlockedAt: unlocked?.unlockedAt ?? null }
}

// Badges groupés par catégorie
const categories = computed(() => {
  const cats = [...new Set(BADGES.map(b => b.category))]
  return cats.map(cat => ({
    name:   cat,
    badges: BADGES.filter(b => b.category === cat).map(enrichBadge),
  }))
})

function openBadge(badge) {
  selectedBadge.value = badge
  showModal.value     = true
}

const selectedProgress = computed(() =>
  selectedBadge.value && !selectedBadge.value.unlockedAt
    ? getBadgeProgress(selectedBadge.value.id, stats.value)
    : null
)

const unlockedCount = computed(() => userBadges.value.length)
</script>

<template>
  <div class="badges">
    <AppHeader title="BADGES" @back="router.back()">
      <template #right>
        <span class="badges__count">{{ unlockedCount }}/{{ BADGES.length }}</span>
      </template>
    </AppHeader>

    <main class="badges__main">
      <section v-for="cat in categories" :key="cat.name" class="badges__category">
        <h2 class="badges__category-title">{{ cat.name }}</h2>

        <div class="badges__grid">
          <button
            v-for="badge in cat.badges"
            :key="badge.id"
            class="badges__item"
            :class="{ 'badges__item--locked': !badge.unlockedAt }"
            @click="openBadge(badge)"
          >
            <span class="badges__item-icon">{{ badge.icon }}</span>
            <span class="badges__item-label">{{ badge.label }}</span>

            <!-- Barre de progression si non débloqué et progression dispo -->
            <template v-if="!badge.unlockedAt">
              <div
                v-if="getBadgeProgress(badge.id, stats)"
                class="badges__item-progress"
              >
                <div
                  class="badges__item-progress-fill"
                  :style="{
                    width: Math.min(
                      Math.round((getBadgeProgress(badge.id, stats).current / getBadgeProgress(badge.id, stats).target) * 100),
                      100
                    ) + '%'
                  }"
                />
              </div>
            </template>

            <span v-else class="badges__item-check">✓</span>
          </button>
        </div>
      </section>
    </main>

    <BadgeDetailModal
      :show="showModal"
      :badge="selectedBadge"
      :progress="selectedProgress"
      @close="showModal = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.badges {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md;
  gap: $gap-md;

  &__count {
    @include title-sm;
    color: $orange;
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-xl;
    @include nav-safe-bottom;
  }

  &__category {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__category-title {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding-bottom: $gap-xs;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $gap-sm;
  }

  &__item {
    background: rgba(255, 255, 255, 0.05);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md $padding-xs;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: $gap-xxs;
    text-align: left;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.09); }

    &--locked {
      opacity: 0.45;
    }
  }

  &__item-icon {
    @include title-xxl;
    line-height: 1;
    margin-bottom: $gap-xxs;
  }

  &__item-label {
    @include title-sm;
    color: $text-color;
    @include title-sm;
    line-height: 1.3;
  }

  &__item-check {
    @include title-xs;
    color: $accent;
    margin-top: 2px;
  }

  &__item-progress {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: $radius-pill;
    overflow: hidden;
    margin-top: $gap-xxs;
  }

  &__item-progress-fill {
    height: 100%;
    background: $orange;
    border-radius: $radius-pill;
  }
}

@media (min-width: $bp-laptop) {
  .badges {
    padding: $padding-xl;
    gap: $gap-lg;

    &__count          { @include title-md; }

    &__main           { gap: $gap-xxl; }

    &__category-title { @include title-md; }

    &__grid {
      grid-template-columns: repeat(4, 1fr);
      gap: $gap-md;
    }

    &__item       { padding: $padding-md $padding-lg $padding-sm; gap: $gap-xs; }
    &__item-icon  { @include display-xs; }
    &__item-label { @include title-md; }
    &__item-check { @include title-sm; }

    &__item-progress { height: 6px; margin-top: $gap-xs; }
  }
}
</style>
