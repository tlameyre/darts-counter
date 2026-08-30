<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppButton from '../components/AppButton.vue'
import { useGameStore } from '../store/gameStore.js'
import { CHECKOUT_BRACKETS, CHECKOUT_DATA_SOURCE } from '../composables/useCheckouts.js'

const router = useRouter()
const gameStore = useGameStore()

const settings = reactive({
  variant: 'review',
  brackets: [CHECKOUT_BRACKETS[2].label], // une tranche cochée au départ
  order: 'asc',
  count: 10,
})

const customCount = ref(15)

const variantOptions = [
  { value: 'review', label: 'Révision libre' },
  { value: 'quiz', label: 'Quiz noté' },
]
const orderOptions = [
  { value: 'asc', label: 'Croissant' },
  { value: 'random', label: 'Aléatoire' },
]
const countOptions = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 'custom', label: 'Custom' },
  { value: Infinity, label: 'Infini' },
]

const isCustomCount = computed(() => settings.count === 'custom')

function toggleBracket(label) {
  const i = settings.brackets.indexOf(label)
  if (i >= 0) {
    if (settings.brackets.length > 1) settings.brackets.splice(i, 1)
  } else {
    settings.brackets.push(label)
  }
}

const canStart = computed(() => settings.brackets.length > 0)

function startGame() {
  const brackets = CHECKOUT_BRACKETS
    .filter((b) => settings.brackets.includes(b.label))
    .map((b) => b.range)

  let count = settings.count
  if (count === 'custom') count = Number(customCount.value) > 0 ? Number(customCount.value) : 10

  gameStore.gameSettings = {
    mode: 'checkout',
    variant: settings.variant,
    brackets,
    order: settings.order,
    count,
  }
  router.push({ name: 'checkout-game' })
}
</script>

<template>
  <div class="settings">
    <AppHeader title="CHECKOUTS" @back="router.push({ name: 'home' })" />

    <main class="settings__main">
      <div class="settings__card">
        <div class="settings__section-label">Mode</div>
        <div class="settings__row">
          <AppButton v-for="opt in variantOptions" :key="opt.value" size="small" variant="ghost"
            :active="settings.variant === opt.value" @click="settings.variant = opt.value">
            {{ opt.label }}
          </AppButton>
        </div>
      </div>

      <div class="settings__card">
        <div class="settings__section-label">Tranches de checkout</div>
        <div class="settings__brackets">
          <AppButton v-for="b in CHECKOUT_BRACKETS" :key="b.label" size="small" variant="ghost"
            :active="settings.brackets.includes(b.label)" @click="toggleBracket(b.label)">
            {{ b.label }}
          </AppButton>
        </div>
      </div>

      <div class="settings__card">
        <div class="settings__section-label">Ordre</div>
        <div class="settings__row">
          <AppButton v-for="opt in orderOptions" :key="opt.value" size="small" variant="ghost"
            :active="settings.order === opt.value" @click="settings.order = opt.value">
            {{ opt.label }}
          </AppButton>
        </div>
      </div>

      <div v-if="settings.variant === 'quiz'" class="settings__card">
        <div class="settings__section-label">Nombre de checkouts</div>
        <div class="settings__row">
          <AppButton v-for="opt in countOptions" :key="String(opt.value)" size="small" variant="ghost"
            :active="settings.count === opt.value" @click="settings.count = opt.value">
            {{ opt.label }}
          </AppButton>
        </div>
        <div v-if="isCustomCount" class="settings__custom">
          <input type="number" v-model="customCount" min="1" max="200" class="settings__custom-input" />
          <span class="settings__custom-label">checkouts</span>
        </div>
      </div>
    </main>

    <AppButton :disabled="!canStart" @click="startGame">COMMENCER</AppButton>
    <p class="settings__source">Données : {{ CHECKOUT_DATA_SOURCE }}</p>
  </div>
</template>

<style lang="scss" scoped>
.settings {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md $padding-md calc($padding-xl + 69px);
  gap: $gap-xl;

  &__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin: 0 auto;
    gap: $gap-xl;
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

  &__row {
    display: flex;
    gap: $gap-xs;

    :deep(.btn) { flex: 1; }
  }

  &__brackets {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-xs;

    :deep(.btn) { flex: 1 1 28%; }
  }

  &__custom {
    display: flex;
    align-items: center;
    gap: $gap-xs;
  }

  &__custom-input {
    flex: 1;
    min-width: 0;
    background: rgba($white, 0.05);
    border: none;
    border-radius: $radius-sm;
    color: $text-color;
    @include title-md;
    padding: $padding-xs $padding-sm;
    text-align: center;

    &:focus { outline: none; }
  }

  &__custom-label {
    @include title-md;
    white-space: nowrap;
  }

  &__source {
    @include text-xs;
    color: $muted;
    text-align: center;
    margin-top: $gap-xs;
  }
}

@media (min-width: $bp-tablet) {
  .settings {
    padding: $padding-xl $padding-xl calc($padding-xl + 69px);

    &__section-label { @include title-xl; }
  }
}
</style>
