<script setup>
import { ref, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'

const props = defineProps({
  show: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'joined'])

const code    = ref('')
const loading = ref(false)
const error   = ref('')

watch(() => props.show, (show) => {
  if (show) { code.value = ''; error.value = '' }
})

defineExpose({ setError: (msg) => { error.value = msg; loading.value = false } })

function submit() {
  if (!code.value.trim() || loading.value) return
  loading.value = true
  error.value   = ''
  emit('joined', code.value.trim())
}
</script>

<template>
  <AppModal :show="show" title="Rejoindre un tournoi" size="sm" @close="$emit('close')">
    <div class="join-modal">
      <input
        v-model="code"
        class="join-modal__input"
        placeholder="Code (ex: T-4F9AB)"
        maxlength="10"
        autocapitalize="characters"
        @keyup.enter="submit"
      />
      <p v-if="error" class="join-modal__error">{{ error }}</p>
      <AppButton :disabled="!code.trim() || loading" @click="submit">
        {{ loading ? 'Vérification...' : 'Rejoindre' }}
      </AppButton>
    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.join-modal {
  display: flex;
  flex-direction: column;
  gap: $gap-md;

  &__input {
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include title-md;
    text-align: center;
    letter-spacing: 0.05em;
    padding: $padding-sm $padding-md;
    text-transform: uppercase;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__error {
    @include text-sm;
    color: $error;
    text-align: center;
  }
}
</style>
