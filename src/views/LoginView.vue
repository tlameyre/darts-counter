<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import AppButton from '../components/AppButton.vue'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

const email    = ref('')
const password = ref('')
const error    = ref('')
const loading  = ref(false)
const oauthLoading = ref(false)

async function onSubmit() {
  error.value   = ''
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    router.replace(typeof route.query.redirect === 'string' ? route.query.redirect : { name: 'play' })
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function onGoogle() {
  error.value = ''
  oauthLoading.value = true
  try {
    await authStore.signInWithOAuth('google')
  } catch (e) {
    error.value = e.message
    oauthLoading.value = false
  }
}
</script>

<template>
  <div class="auth">
    <header class="auth__header">
      <h1 class="auth__title">DARTS<br>TRAINER</h1>
    </header>

    <form class="auth__form" @submit.prevent="onSubmit">
      <h2 class="auth__subtitle">Connexion</h2>

      <div class="auth__field">
        <label class="auth__label">Email</label>
        <input v-model="email" class="auth__input" type="email" placeholder="tu@exemple.com" required autocomplete="email" />
      </div>

      <div class="auth__field">
        <label class="auth__label">Mot de passe</label>
        <input v-model="password" class="auth__input" type="password" placeholder="••••••••" required autocomplete="current-password" />
      </div>

      <p v-if="error" class="auth__error">{{ error }}</p>

      <AppButton type="submit" variant="primary" :disabled="loading" class="auth__btn">
        {{ loading ? 'Connexion…' : 'Se connecter' }}
      </AppButton>

      <div class="auth__divider"><span>ou</span></div>

      <button type="button" class="auth__oauth" :disabled="oauthLoading" @click="onGoogle">
        <!-- Google G logo -->
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.332 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
          <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
          <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.314 0-9.822-3.398-11.42-8.073l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
          <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
        </svg>
        {{ oauthLoading ? 'Redirection…' : 'Continuer avec Google' }}
      </button>
    </form>

    <p class="auth__switch">
      Pas encore de compte ?
      <router-link :to="{ name: 'register' }">S'inscrire</router-link>
    </p>
  </div>
</template>

<style lang="scss" scoped>
.auth {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: 420px;
  margin: 0 auto;
  padding: $padding-lg $padding-md $padding-xl;
  gap: $padding-xl;

  &__header {
    padding-top: $padding-lg;
  }

  &__title {
    @include text-xxl;
    font-weight: 600;
    line-height: 0.9;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
  }

  &__subtitle {
    @include title-lg;
    color: $text-color;
    margin-bottom: $gap-xs;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: $gap-xxs;
  }

  &__label {
    @include text-sm;
    color: $muted;
  }

  &__input {
    @include text-sm;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: $input-placeholder; }

    &:focus {
      border-color: rgba(255, 255, 255, 0.4);
    }
  }

  &__error {
    @include text-sm;
    color: $error;
  }

  &__btn {
    margin-top: $gap-xs;
  }

  &__divider {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    color: $muted;

    &::before, &::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(255, 255, 255, 0.12);
    }

    span { @include text-sm; }
  }

  &__oauth {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $gap-sm;
    @include text-sm;
    color: $text-color;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.12); }
  }

  &__switch {
    @include text-sm;
    color: $muted;
    text-align: center;

    a { color: $orange; text-decoration: none; }
  }
}
</style>
