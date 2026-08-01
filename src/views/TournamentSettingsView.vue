<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import { useTournamentStore } from '../store/tournamentStore.js'

const router          = useRouter()
const tournamentStore = useTournamentStore()

const SCORE_OPTIONS = [301, 501]
const MIN_LEGS      = 1
const MAX_LEGS      = 9

const step = ref(1)

const name        = ref(`Tournoi du ${new Date().toLocaleDateString('fr-FR')}`)
const description = ref('')
const settings = reactive({
  scoreKey:  501,
  legsToWin: 2,
})
const customScore = ref(401)
const creating     = ref(false)

const isCustomScore  = computed(() => settings.scoreKey === 'custom')
const effectiveScore = computed(() =>
  isCustomScore.value ? Math.max(1, Number(customScore.value) || 501) : settings.scoreKey
)
const canSubmitStep1 = computed(() => name.value.trim().length > 0)

function decrementLegs() {
  settings.legsToWin = Math.max(MIN_LEGS, settings.legsToWin - 1)
}

function incrementLegs() {
  settings.legsToWin = Math.min(MAX_LEGS, settings.legsToWin + 1)
}

function goToStep2() {
  if (!canSubmitStep1.value) return
  step.value = 2
}

function backFromHeader() {
  if (step.value === 2) { step.value = 1; return }
  router.push({ name: 'tournaments' })
}

async function createTournament() {
  if (creating.value) return
  creating.value = true
  const id = await tournamentStore.createTournamentShell({
    name:        name.value.trim(),
    description: description.value.trim(),
    startScore:  effectiveScore.value,
    legsToWin:   settings.legsToWin,
  })
  creating.value = false
  if (id) router.push({ name: 'tournament-detail', params: { id } })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="Nouveau tournoi" @back="backFromHeader" />

    <main class="settings__main">

      <template v-if="step === 1">
        <div class="settings__card">
          <div class="settings__section-label">Nom du tournoi</div>
          <input v-model="name" class="settings__name-input" maxlength="60" />
        </div>

        <div class="settings__card">
          <div class="settings__section-label">Description</div>
          <textarea v-model="description" class="settings__description-input" rows="4" maxlength="240"
            placeholder="Optionnel" />
        </div>
      </template>

      <template v-else>
        <div class="settings__card">
          <div class="settings__section-label">Score de départ</div>
          <div class="settings__row">
            <AppButton
              v-for="s in SCORE_OPTIONS" :key="s"
              size="small" variant="ghost" :active="settings.scoreKey === s"
              @click="settings.scoreKey = s"
            >{{ s }}</AppButton>
            <AppButton size="small" variant="ghost" :active="isCustomScore" @click="settings.scoreKey = 'custom'">
              Custom
            </AppButton>
          </div>
          <Transition name="slide-fade">
            <div v-if="isCustomScore" class="settings__custom-field">
              <input
                v-model.number="customScore"
                type="number" min="1" max="9999"
                class="settings__custom-input"
                placeholder="ex: 701"
              />
              <span class="settings__custom-label">pts</span>
            </div>
          </Transition>
        </div>

        <div class="settings__card">
          <div class="settings__section-label">Manches à gagner (par match)</div>
          <div class="settings__stepper">
            <button
              class="settings__stepper-btn"
              :disabled="settings.legsToWin <= MIN_LEGS"
              @click="decrementLegs"
            >−</button>
            <span class="settings__stepper-value">{{ settings.legsToWin }}</span>
            <button
              class="settings__stepper-btn"
              :disabled="settings.legsToWin >= MAX_LEGS"
              @click="incrementLegs"
            >+</button>
          </div>
          <p class="settings__hint">
            Le roster (joueurs) se gère après la création, une fois le tournoi ouvert aux inscriptions.
          </p>
        </div>
      </template>

    </main>

    <div class="settings__pager">
      <span class="settings__dot" :class="{ 'settings__dot--active': step === 1 }" />
      <span class="settings__dot" :class="{ 'settings__dot--active': step === 2 }" />
    </div>

    <AppButton v-if="step === 1" :disabled="!canSubmitStep1" @click="goToStep2">Suivant</AppButton>
    <AppButton v-else :disabled="creating" @click="createTournament">
      {{ creating ? 'Création...' : 'Créer le tournoi' }}
    </AppButton>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-xxl;
    padding: $padding-md 0;
  }

  &__card {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__section-label {
    @include title-lg;
    color: $white;
  }

  &__name-input {
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include text-md;
    padding: $padding-sm $padding-md;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__description-input {
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include text-md;
    padding: $padding-sm $padding-md;
    resize: none;
    font-family: inherit;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }

  &__stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-lg;
  }

  &__stepper-btn {
    width: 44px;
    height: 44px;
    border-radius: $radius-pill;
    border: $border-md solid rgba($white, 0.15);
    background: rgba($white, 0.05);
    color: $text-color;
    @include title-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, color 0.15s, opacity 0.15s;

    &:active:not(:disabled) {
      border-color: $orange;
      color: $orange;
    }

    &:disabled {
      opacity: 0.3;
    }
  }

  &__stepper-value {
    @include display-sm;
    color: $white;
    min-width: 48px;
    text-align: center;
  }

  &__custom-field {
    display: flex;
    align-items: center;
    gap: $gap-sm;
  }

  &__custom-input {
    flex: 1;
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include title-md;
    padding: $padding-xs $padding-sm;
    text-align: center;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__custom-label {
    @include title-md;
    color: $muted;
    white-space: nowrap;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }

  &__pager {
    display: flex;
    justify-content: center;
    gap: $gap-xs;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: $radius-pill;
    background: rgba($white, 0.2);

    &--active {
      background: $orange;
    }
  }
}

@media (min-width: $bp-laptop) {
  .settings {
    padding: $padding-xl $padding-xl calc($padding-xxl + 64px);
    gap: $gap-lg;

    &__main {
      gap: $gap-xxl;
      padding: $padding-lg 0;
    }

    &__section-label     { @include title-xl; }
    &__name-input         { @include text-lg; }
    &__description-input  { @include text-lg; }
    &__stepper-btn         { @include title-xl; }
    &__stepper-value       { @include display-md; }
    &__custom-input       { @include title-lg; padding: $padding-sm $padding-md; }
    &__custom-label       { @include title-lg; }
    &__hint               { @include title-md; }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
