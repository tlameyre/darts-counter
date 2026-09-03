<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTournamentStore } from '../store/tournamentStore.js'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'

const props = defineProps({
  // Preview /dev uniquement
  mockPreview: { type: Object, default: null },
})

const route           = useRoute()
const router           = useRouter()
const tournamentStore  = useTournamentStore()

const preview = ref(null)
const loading = ref(true)
const joining = ref(false)
const error   = ref('')

onMounted(async () => {
  if (props.mockPreview) {
    preview.value = props.mockPreview
    loading.value = false
    return
  }
  preview.value = await tournamentStore.fetchTournamentPreviewByCode(route.params.code)
  loading.value = false
})

async function join() {
  if (joining.value) return
  joining.value = true
  const tournamentId = await tournamentStore.joinTournament(route.params.code)
  joining.value = false
  if (tournamentId) {
    router.push({ name: 'tournament-detail', params: { id: tournamentId } })
  } else {
    error.value = "Impossible de rejoindre ce tournoi (code invalide ou tournoi déjà démarré)."
  }
}
</script>

<template>
  <div class="join">
    <AppHeader title="Rejoindre" @back="router.push({ name: 'tournaments' })" />

    <main class="join__main">
      <p v-if="loading" class="join__loading">Chargement…</p>

      <template v-else-if="preview">
        <div class="join__card">
          <div class="join__icon">🏆</div>
          <h2 class="join__name">{{ preview.name }}</h2>
          <p v-if="preview.description" class="join__description">{{ preview.description }}</p>
          <div class="join__meta">
            <span>Organisé par {{ preview.host_name }}</span>
            <span>{{ preview.participant_count }} participant(s)</span>
          </div>
          <p v-if="preview.status !== 'pending'" class="join__warning">
            Ce tournoi a déjà démarré, impossible de le rejoindre.
          </p>
        </div>

        <p v-if="error" class="join__error">{{ error }}</p>

        <AppButton :disabled="joining || preview.status !== 'pending'" @click="join">
          {{ joining ? 'Inscription...' : 'Rejoindre' }}
        </AppButton>
      </template>

      <p v-else class="join__error">Code de tournoi invalide.</p>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.join {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md 0;
  gap: $gap-md;
  @include nav-safe-bottom;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    padding: $padding-md 0;
    justify-content: center;
  }

  &__loading {
    @include text-sm;
    color: $muted;
    text-align: center;
  }

  &__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-xl;
    background: rgba($white, 0.05);
    border-radius: $radius-md;
    text-align: center;
  }

  &__icon { font-size: 40px; line-height: 1; }
  &__name { @include title-xl; color: $text-color; }
  &__description { @include text-sm; color: $muted; }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 2px;
    @include text-sm;
    color: $muted;
  }

  &__warning {
    @include text-sm;
    color: $error;
  }

  &__error {
    @include text-sm;
    color: $error;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .join {
    padding: $padding-xl $padding-xl 0;
    gap: $gap-lg;
    @include nav-safe-bottom($padding-xl);
  }
}
</style>
