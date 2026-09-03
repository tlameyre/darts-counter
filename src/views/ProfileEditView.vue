<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore.js'
import { useBadgeStore } from '../store/badgeStore.js'
import BadgeUnlockOverlay from '../components/BadgeUnlockOverlay.vue'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import ChangeEmailModal from '../components/profile/ChangeEmailModal.vue'
import ChangePasswordModal from '../components/profile/ChangePasswordModal.vue'

const router     = useRouter()
const authStore  = useAuthStore()
const badgeStore = useBadgeStore()

const firstName   = ref(authStore.profile?.first_name ?? '')
const lastName    = ref(authStore.profile?.last_name  ?? '')
const username    = ref(authStore.profile?.username   ?? '')
const saveLoading = ref(false)
const feedback    = ref('')
const newBadges   = ref([])

const showEmailModal    = ref(false)
const showPasswordModal = ref(false)

// Sync si le profil se charge après le montage
watch(() => authStore.profile, (p) => {
  if (!p) return
  firstName.value = p.first_name ?? ''
  lastName.value  = p.last_name  ?? ''
  username.value  = p.username   ?? ''
}, { immediate: true })

async function onSave() {
  saveLoading.value = true
  feedback.value    = ''
  try {
    await authStore.updateProfile({
      first_name: firstName.value.trim(),
      last_name:  lastName.value.trim(),
      username:   username.value.trim(),
    })
    const badges = await badgeStore.checkProfileBadge(authStore.profile)
    if (badges.length) {
      newBadges.value = badges
    } else {
      router.back()
    }
  } catch (e) {
    feedback.value = e.message
  } finally {
    saveLoading.value = false
  }
}

async function onEmailSave(newEmail) {
  try {
    await authStore.updateEmail(newEmail)
    showEmailModal.value = false
    feedback.value = 'Un email de confirmation a été envoyé.'
    setTimeout(() => { feedback.value = '' }, 4000)
  } catch (e) {
    feedback.value = e.message
  }
}

async function onPasswordSave(newPassword) {
  try {
    await authStore.updatePassword(newPassword)
    showPasswordModal.value = false
    feedback.value = 'Mot de passe mis à jour.'
    setTimeout(() => { feedback.value = '' }, 4000)
  } catch (e) {
    feedback.value = e.message
  }
}
</script>

<template>
  <div class="profile-edit">
    <AppHeader title="MODIFIER LE PROFIL" @back="router.back()">
      <template #right>
        <button class="profile-edit__save-btn" :disabled="saveLoading" @click="onSave">
          {{ saveLoading ? '…' : 'OK' }}
        </button>
      </template>
    </AppHeader>

    <main class="profile-edit__main">

      <!-- Identité -->
      <section class="profile-edit__section">
        <h2 class="profile-edit__section-title">Identité</h2>

        <div class="profile-edit__field">
          <label class="profile-edit__label">Prénom</label>
          <input v-model="firstName" class="profile-edit__input" type="text" placeholder="Ton prénom" autocomplete="given-name" />
        </div>

        <div class="profile-edit__field">
          <label class="profile-edit__label">Nom</label>
          <input v-model="lastName" class="profile-edit__input" type="text" placeholder="Ton nom" autocomplete="family-name" />
        </div>

        <div class="profile-edit__field">
          <label class="profile-edit__label">Surnom</label>
          <input v-model="username" class="profile-edit__input" type="text" placeholder="Ton surnom" autocomplete="nickname" />
        </div>
      </section>

      <!-- Compte -->
      <section class="profile-edit__account">
        <h2 class="profile-edit__section-title">Compte</h2>

        <button class="profile-edit__account-item" @click="showEmailModal = true">
          <div>
            <p class="profile-edit__account-label">Adresse email</p>
            <p class="profile-edit__account-value">{{ authStore.user?.email }}</p>
          </div>
          <AppIcon name="arrow-left" :width="16" :height="16" class="profile-edit__arrow" />
        </button>

        <button class="profile-edit__account-item" @click="showPasswordModal = true">
          <div>
            <p class="profile-edit__account-label">Mot de passe</p>
            <p class="profile-edit__account-value">••••••••</p>
          </div>
          <AppIcon name="arrow-left" :width="16" :height="16" class="profile-edit__arrow" />
        </button>
      </section>

      <p v-if="feedback" class="profile-edit__feedback">{{ feedback }}</p>

    </main>

    <ChangeEmailModal
      :show="showEmailModal"
      :current-email="authStore.user?.email ?? ''"
      @close="showEmailModal = false"
      @save="onEmailSave"
    />

    <ChangePasswordModal
      :show="showPasswordModal"
      @close="showPasswordModal = false"
      @save="onPasswordSave"
    />

    <BadgeUnlockOverlay :badges="newBadges" @done="router.back()" />
  </div>
</template>

<style lang="scss" scoped>
.profile-edit {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: $padding-md;
  gap: $gap-md;

  &__save-btn {
    @include title-sm;
    color: $orange;
    padding: $padding-xxs;
    transition: opacity 0.15s;
    &:disabled { opacity: 0.5; }
    &:active { opacity: 0.6; }
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: $gap-lg;
    @include nav-safe-bottom;
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

    &::placeholder { color: rgba(255, 255, 255, 0.2); }
    &:focus { border-color: rgba(255, 255, 255, 0.4); }
  }

  &__account {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__account-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgba(255, 255, 255, 0.05);
    color: $white;
    border-radius: $radius-md;
    padding: $padding-sm $padding-md;
    text-align: left;
    transition: background 0.15s;

    &:active { background: rgba(255, 255, 255, 0.08); }
  }

  &__account-label {
    @include text-xs;
    color: $muted;
    margin-bottom: 2px;
  }

  &__account-value {
    @include text-sm;
    color: $text-color;
  }

  &__arrow {
    transform: rotate(180deg);
    color: $muted;
    flex-shrink: 0;
  }

  &__feedback {
    @include text-sm;
    color: $accent;
    text-align: center;
  }
}

@media (min-width: $bp-laptop) {
  .profile-edit {
    padding: $padding-xl;
    gap: $gap-lg;

    &__save-btn    { @include title-md; }

    &__main { gap: $gap-xl; }

    &__section-title { @include title-md; }

    &__label { @include text-md; }
    &__input {
      @include text-md;
      padding: $padding-md $padding-lg;
    }

    &__account-item  { padding: $padding-md $padding-lg; }
    &__account-label { @include text-sm; }
    &__account-value { @include text-md; }

    &__feedback { @include text-md; }
  }
}
</style>
