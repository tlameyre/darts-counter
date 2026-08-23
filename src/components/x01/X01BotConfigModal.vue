<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'
import ToggleSwitch from '../ToggleSwitch.vue'
import AppSlider from '../AppSlider.vue'
import { AI_LEVELS } from '../../composables/useX01AI.js'

const props = defineProps({
  show:       { type: Boolean, required: true },
  modelValue: { type: Object, default: null }, // profil existant si édition, null si création
})

const emit = defineEmits(['close', 'confirm'])

const AVG_STEPS      = AI_LEVELS.map(l => l.avgVolley)
const CHECKOUT_STEPS = AI_LEVELS.map(l => l.checkoutRate)

const level      = ref(5)
const customMode = ref(false)
const customAvg  = ref(5)
const customCo    = ref(5)

function resetFromModelValue() {
  const p = props.modelValue
  level.value      = p?.level ?? 5
  customMode.value = !p?.level && !!p
  customAvg.value  = AVG_STEPS.findIndex(v => v === p?.avgVolley) + 1 || 5
  customCo.value   = CHECKOUT_STEPS.findIndex(v => v === p?.checkoutRate) + 1 || 5
}

watch(() => props.show, (show) => {
  if (show) resetFromModelValue()
})

const profile = computed(() => {
  if (customMode.value) {
    return {
      level:        null,
      label:        'Custom',
      avgVolley:    AVG_STEPS[customAvg.value - 1],
      checkoutRate: CHECKOUT_STEPS[customCo.value - 1],
    }
  }
  return AI_LEVELS[level.value - 1]
})

const hint = computed(() =>
  `Moy. ${profile.value.avgVolley} pts/volée · ${Math.round(profile.value.checkoutRate * 100)}% aux checkouts`
)

function confirm() {
  emit('confirm', profile.value)
  emit('close')
}
</script>

<template>
  <AppModal :show="show" title="DartBot" size="lg" @close="emit('close')">
    <div class="bot-config">

      <Transition name="slide-fade">
        <AppSlider
          v-if="!customMode"
          v-model="level"
          :min="1"
          :max="10"
          label="Niveau"
          :value-label="`${level} — ${AI_LEVELS[level - 1].label}`"
        />
      </Transition>

      <ToggleSwitch
        v-model="customMode"
        title="Niveau custom"
        description="Définis toi-même les stats du DartBot"
      />

      <Transition name="slide-fade">
        <div v-if="customMode" class="bot-config__custom">
          <AppSlider
            v-model="customAvg"
            :min="1"
            :max="10"
            label="Moyenne par volée"
            :value-label="`${AVG_STEPS[customAvg - 1]} pts`"
          />
          <AppSlider
            v-model="customCo"
            :min="1"
            :max="10"
            label="Taux de checkout"
            :value-label="`${Math.round(CHECKOUT_STEPS[customCo - 1] * 100)} %`"
          />
        </div>
      </Transition>

      <p class="bot-config__hint">{{ hint }}</p>

      <AppButton @click="confirm">Valider</AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.bot-config {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;

  &__custom {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
  }

  &__hint {
    @include title-sm;
    color: $muted;
  }
}

@media (min-width: $bp-laptop) {
  .bot-config__hint { @include title-md; }
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
