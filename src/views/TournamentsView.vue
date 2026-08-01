<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import AppTabs from '../components/AppTabs.vue'
import TournamentListCard from '../components/tournament/TournamentListCard.vue'
import TournamentJoinByCodeModal from '../components/tournament/TournamentJoinByCodeModal.vue'

const router          = useRouter()
const tournamentStore = useTournamentStore()

const showJoinModal = ref(false)
const joinModalRef  = ref(null)

async function onJoinCode(code) {
  const tournamentId = await tournamentStore.joinTournament(code)
  if (tournamentId) {
    showJoinModal.value = false
    router.push({ name: 'tournament-detail', params: { id: tournamentId } })
  } else {
    joinModalRef.value?.setError("Code invalide ou tournoi déjà démarré.")
  }
}

const TABS = [
  { id: 'active',    label: 'En cours' },
  { id: 'completed', label: 'Terminés' },
]
const activeTab = ref('active')

onMounted(() => {
  tournamentStore.fetchTournaments()
  tournamentStore.subscribeToTournamentList()
})

onUnmounted(() => {
  tournamentStore.unsubscribeFromTournamentList()
})

const filtered = computed(() =>
  tournamentStore.tournaments.filter(t =>
    activeTab.value === 'active' ? t.status !== 'completed' : t.status === 'completed'
  )
)

function openTournament(id) {
  router.push({ name: 'tournament-detail', params: { id } })
}
</script>

<template>
  <div class="tournaments">
    <AppHeader title="Tournois" @back="router.push({ name: 'play' })" />

    <main class="tournaments__main">
      <AppTabs v-model="activeTab" :tabs="TABS" />

      <div v-if="filtered.length" class="tournaments__list">
        <TournamentListCard
          v-for="t in filtered"
          :key="t.id"
          :tournament="t"
          @click="openTournament(t.id)"
        />
      </div>
      <p v-else class="tournaments__empty">
        {{ activeTab === 'active' ? 'Aucun tournoi en cours.' : 'Aucun tournoi terminé.' }}
      </p>
    </main>

    <div class="tournaments__actions">
      <AppButton variant="ghost" @click="showJoinModal = true">Rejoindre un tournoi</AppButton>
      <AppButton @click="router.push({ name: 'tournament-settings' })">Créer un tournoi</AppButton>
    </div>

    <TournamentJoinByCodeModal
      ref="joinModalRef"
      :show="showJoinModal"
      @close="showJoinModal = false"
      @joined="onJoinCode"
    />
  </div>
</template>

<style lang="scss" scoped>
.tournaments {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-md 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xl 0;
  }

  &__actions {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }
}

@media (min-width: $bp-laptop) {
  .tournaments {
    padding: $padding-xl $padding-xl calc($padding-xxl + 64px);
    gap: $gap-lg;

    &__main { gap: $gap-xl; padding: $padding-lg 0; }
    &__empty { @include text-md; }
  }
}
</style>
