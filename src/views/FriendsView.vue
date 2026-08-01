<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../store/authStore.js'
import { useFriendStore } from '../store/friendStore.js'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/AppIcon.vue'
import AppTabs from '../components/AppTabs.vue'
import FriendCard from '../components/friends/FriendCard.vue'
import MyFriendCode from '../components/friends/MyFriendCode.vue'
import UserSearchResult from '../components/friends/UserSearchResult.vue'

// Props mock optionnelles — utilisées uniquement dans /dev pour prévisualiser sans auth
const props = defineProps({
  mockFriends:    { type: Array,  default: null },
  mockReceived:   { type: Array,  default: null },
  mockSent:       { type: Array,  default: null },
  mockFriendCode: { type: String, default: null },
})

const isMock = computed(() => props.mockFriends !== null)

const authStore   = useAuthStore()
const router = useRouter()
const friendStore = useFriendStore()

const activeTab   = ref('friends')
const addInput    = ref('')
const addLoading  = ref(false)
const addFeedback = ref({ message: '', isError: false })

// Search state
const searchResults  = ref([])
const searchLoading  = ref(false)
const sentUserIds    = ref(new Set())
let   searchTimeout   = null
let   feedbackTimeout = null

function setFeedback(message, isError = false) {
  clearTimeout(feedbackTimeout)
  addFeedback.value = { message, isError }
  if (message) feedbackTimeout = setTimeout(() => { addFeedback.value = { message: '', isError: false } }, 3000)
}

const isDmcCode = computed(() => /^DMC-/i.test(addInput.value.trim()))

onMounted(() => { if (!isMock.value) friendStore.fetchFriends() })

const friends         = computed(() => isMock.value ? props.mockFriends         : friendStore.friends)
const pendingReceived = computed(() => isMock.value ? props.mockReceived         : friendStore.pendingReceived)
const pendingSent     = computed(() => isMock.value ? props.mockSent             : friendStore.pendingSent)
const friendCode      = computed(() => isMock.value ? props.mockFriendCode       : authStore.profile?.friend_code)
const isLoading       = computed(() => isMock.value ? false                      : friendStore.loading)

watch(addInput, (val) => {
  clearTimeout(searchTimeout)

  const q = val.trim()
  if (q) setFeedback('')

  if (!q || isDmcCode.value || isMock.value) {
    searchResults.value = []
    return
  }
  if (q.length < 2) {
    searchResults.value = []
    return
  }

  searchTimeout = setTimeout(async () => {
    searchLoading.value = true
    searchResults.value = await friendStore.searchUsers(q)
    searchLoading.value = false
  }, 400)
})

async function onAddFriend() {
  if (!addInput.value.trim()) return
  if (isMock.value) {
    setFeedback('Demande envoyée à Pro180 !')
    addInput.value = ''
    return
  }
  addLoading.value = true
  setFeedback('')
  const result = await friendStore.sendRequest(addInput.value)
  if (result.success) {
    setFeedback(`Demande envoyée à ${result.name} !`)
    addInput.value       = ''
    searchResults.value  = []
  } else {
    setFeedback(result.error, true)
  }
  addLoading.value = false
}

async function onAddFromSearch(user) {
  sentUserIds.value.add(user.id)
  const result = await friendStore.sendRequest(user.friend_code)
  if (result.success) {
    setFeedback(`Demande envoyée à ${result.name} !`)
    addInput.value       = ''
    searchResults.value  = []
  } else {
    sentUserIds.value.delete(user.id)
    setFeedback(result.error, true)
  }
}

const tabs = [
  { key: 'friends',  label: 'Amis' },
  { key: 'requests', label: 'Demandes' },
  { key: 'add',      label: 'Ajouter' },
]
</script>

<template>
  <div class="friends">
    <AppHeader title="AMIS" @back="router.back()"/>

    <!-- Mon code ami -->
    <div class="friends__my-code" v-if="friendCode">
      <MyFriendCode :code="friendCode" />
    </div>

    <AppTabs variant="underline" :tabs="tabs.map(t => ({ id: t.key, label: t.label }))" v-model="activeTab">
      <template #requests>
        Demandes
        <span v-if="pendingReceived.length" class="friends__badge">{{ pendingReceived.length }}</span>
      </template>
    </AppTabs>

    <!-- Contenu -->
    <main class="friends__content">

      <!-- Onglet Amis -->
      <template v-if="activeTab === 'friends'">
        <div v-if="isLoading" class="friends__empty">Chargement…</div>
        <div v-else-if="!friends.length" class="friends__empty">
          Aucun ami pour l'instant.<br>Utilise l'onglet "Ajouter" pour en trouver.
        </div>
        <div v-else class="friends__list">
          <FriendCard
            v-for="f in friends"
            :key="f.friendshipId"
            :friend="f"
            variant="friend"
            @remove="friendStore.removeFriendship"
          />
        </div>
      </template>

      <!-- Onglet Demandes -->
      <template v-else-if="activeTab === 'requests'">
        <template v-if="pendingReceived.length">
          <p class="friends__section-title">Reçues</p>
          <div class="friends__list">
            <FriendCard
              v-for="f in pendingReceived"
              :key="f.friendshipId"
              :friend="f"
              variant="received"
              @accept="friendStore.acceptRequest"
              @remove="friendStore.removeFriendship"
            />
          </div>
        </template>

        <template v-if="pendingSent.length">
          <p class="friends__section-title">Envoyées</p>
          <div class="friends__list">
            <FriendCard
              v-for="f in pendingSent"
              :key="f.friendshipId"
              :friend="f"
              variant="sent"
              @remove="friendStore.removeFriendship"
            />
          </div>
        </template>

        <div
          v-if="!pendingReceived.length && !pendingSent.length"
          class="friends__empty"
        >
          Aucune demande en cours.
        </div>
      </template>

      <!-- Onglet Ajouter -->
      <template v-else-if="activeTab === 'add'">
        <div class="friends__add">
          <p class="friends__add-hint">
            Recherche par prénom ou pseudo, ou entre directement un code ami (DMC-XXXX).
          </p>
          <div class="friends__add-row">
            <input
              v-model="addInput"
              class="friends__add-input"
              :class="{ 'friends__add-input--code': isDmcCode }"
              type="text"
              placeholder="Prénom, pseudo ou DMC-XXXX"
              autocomplete="off"
              :autocapitalize="isDmcCode ? 'characters' : 'none'"
              @keyup.enter="isDmcCode ? onAddFriend() : null"
            />
            <button
              v-if="isDmcCode"
              class="friends__add-btn"
              :disabled="addLoading || !addInput.trim()"
              @click="onAddFriend"
            >
              <AppIcon v-if="!addLoading" name="user-plus" :width="18" :height="18" />
              <span v-else>…</span>
            </button>
          </div>

          <!-- Résultats de recherche -->
          <div v-if="searchLoading" class="friends__search-hint">Recherche…</div>
          <div
            v-else-if="!isDmcCode && addInput.trim().length >= 2 && searchResults.length === 0 && !searchLoading"
            class="friends__search-hint"
          >
            Aucun résultat pour « {{ addInput.trim() }} »
          </div>
          <div v-else-if="searchResults.length" class="friends__list">
            <UserSearchResult
              v-for="u in searchResults"
              :key="u.id"
              :user="u"
              :sent="sentUserIds.has(u.id)"
              @add="onAddFromSearch"
            />
          </div>

          <p
            v-if="addFeedback.message"
            class="friends__add-feedback"
            :class="{ 'friends__add-feedback--error': addFeedback.isError }"
          >
            {{ addFeedback.message }}
          </p>
        </div>
      </template>

    </main>
  </div>
</template>

<style lang="scss" scoped>
.friends {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: 0 auto;
  padding: $padding-lg $padding-md calc($padding-xxl + 64px);
  gap: $gap-md;

  &__my-code {
    display: flex;
    justify-content: center;
    padding-bottom: $padding-md;
    border-bottom: $border-sm solid rgba(255, 255, 255, 0.07);
  }

  &__badge {
    @include text-xs;
    background: $orange;
    color: $white;
    border-radius: $radius-pill;
    padding: 1px 6px;
    min-width: 18px;
    text-align: center;
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-title {
    @include text-xs;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-top: $padding-xs;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-xxl $padding-md;
    line-height: 1.6;
  }

  &__add {
    display: flex;
    flex-direction: column;
    gap: $gap-md;
    padding-top: $padding-sm;
  }

  &__add-hint {
    @include text-sm;
    color: $muted;
  }

  &__add-row {
    display: flex;
    gap: $gap-sm;
  }

  &__add-input {
    @include title-md;
    flex: 1;
    background: rgba(255, 255, 255, 0.07);
    border: $border-sm solid rgba(255, 255, 255, 0.15);
    border-radius: $radius-md;
    color: $text-color;
    padding: $padding-sm $padding-md;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: rgba(255, 255, 255, 0.2); }
    &:focus { border-color: rgba(255, 255, 255, 0.4); }

    &--code {
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  }

  &__search-hint {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-sm 0;
  }

  &__add-btn {
    width: 48px;
    height: 48px;
    border-radius: $radius-md;
    background: $orange;
    color: $white;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: opacity 0.15s;

    &:disabled { opacity: 0.4; }
    &:not(:disabled):active { opacity: 0.8; }
  }

  &__add-feedback {
    @include text-sm;
    color: $accent;

    &--error { color: $error; }
  }
}

@media (min-width: $bp-laptop) {
  .friends {
    padding: $padding-xxl;

    &__section-title { @include text-sm; }
    &__empty       { @include text-md; }
    &__add-hint    { @include text-md; }
    &__add-input   { @include title-lg; }
    &__add-feedback { @include text-md; }
    &__search-hint { @include text-md; }
  }
}
</style>
