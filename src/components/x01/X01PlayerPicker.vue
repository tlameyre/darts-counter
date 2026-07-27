<script setup>
import { ref, computed, watch } from 'vue'
import AppModal from '../AppModal.vue'
import AppButton from '../AppButton.vue'
import AppIcon from '../AppIcon.vue'
import { useFriendStore } from '../../store/friendStore.js'

const props = defineProps({
  show:    { type: Boolean, required: true },
  friends: { type: Array,   default: () => [] },
  // Already selected player ids to exclude (friends, searched accounts, guests)
  selectedIds: { type: Array, default: () => [] },
  // Nombre de joueurs qu'il est encore possible d'ajouter (limite du mode de jeu)
  maxAdditional: { type: Number, default: Infinity },
})

const emit = defineEmits(['close', 'select'])

const friendStore = useFriendStore()

const selectedFriendIds = ref([])
const guestNames        = ref([])
const newGuestName      = ref('')
const showGuestInput    = ref(false)
const guestError        = ref('')

const searchQuery         = ref('')
const searchResults       = ref([])
const searchLoading       = ref(false)
// Objets complets (pas juste des ids) car searchResults est remplacé à chaque
// nouvelle recherche : il faut garder les utilisateurs choisis lors d'une
// recherche précédente même si la requête actuelle ne les renvoie plus.
const selectedSearchUsers    = ref([])
const friendRequestLoadingIds = ref([])
const sentFriendRequestIds    = ref([])
let   searchTimeout       = null

function toggleFriend(friend) {
  const idx = selectedFriendIds.value.indexOf(friend.id)
  if (idx === -1) {
    if (limitReached.value) return
    selectedFriendIds.value.push(friend.id)
  } else {
    selectedFriendIds.value.splice(idx, 1)
  }
}

function toggleSearchResult(user) {
  const idx = selectedSearchUsers.value.findIndex(u => u.id === user.id)
  if (idx === -1) {
    if (limitReached.value) return
    selectedSearchUsers.value.push(user)
  } else {
    selectedSearchUsers.value.splice(idx, 1)
  }
}

async function sendFriendRequest(user) {
  if (friendRequestLoadingIds.value.includes(user.id) || sentFriendRequestIds.value.includes(user.id)) return
  friendRequestLoadingIds.value.push(user.id)
  const result = await friendStore.sendRequest(user.friend_code)
  friendRequestLoadingIds.value = friendRequestLoadingIds.value.filter(id => id !== user.id)
  if (result.success) sentFriendRequestIds.value.push(user.id)
}

watch(searchQuery, (val) => {
  clearTimeout(searchTimeout)
  const q = val.trim()
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

watch(newGuestName, () => { guestError.value = '' })

function addGuest() {
  const name = newGuestName.value.trim()
  if (!name) return
  if (limitReached.value) {
    guestError.value = 'Limite de joueurs atteinte.'
    return
  }
  if (guestNames.value.some(g => g.toLowerCase() === name.toLowerCase())) {
    guestError.value = 'Ce nom est déjà utilisé.'
    return
  }
  guestError.value     = ''
  guestNames.value.push(name)
  newGuestName.value   = ''
  showGuestInput.value = false
}

function removeGuest(i) {
  guestNames.value.splice(i, 1)
}

const availableFriends = computed(() =>
  props.friends.filter(f => !props.selectedIds.includes(f.id))
)

const friendIds = computed(() => props.friends.map(f => f.id))

const selectedSearchIds = computed(() => selectedSearchUsers.value.map(u => u.id))

const availableSearchResults = computed(() =>
  searchResults.value.filter(u =>
    !props.selectedIds.includes(u.id) && !friendIds.value.includes(u.id) && !selectedSearchIds.value.includes(u.id)
  )
)

function confirm() {
  const friends = availableFriends.value
    .filter(f => selectedFriendIds.value.includes(f.id))
    .map(f => ({ id: f.id, name: f.username || f.first_name || 'Ami', isFriend: true }))

  const searched = selectedSearchUsers.value
    .map(u => ({ id: u.id, name: u.username || u.first_name || 'Joueur', isRegistered: true }))

  const guests = guestNames.value.map((name, i) => ({
    id:      `guest-${Date.now()}-${i}`,
    name,
    isGuest: true,
  }))

  emit('select', [...friends, ...searched, ...guests])
  selectedFriendIds.value       = []
  selectedSearchUsers.value     = []
  friendRequestLoadingIds.value = []
  sentFriendRequestIds.value    = []
  searchQuery.value             = ''
  searchResults.value           = []
  guestNames.value              = []
  newGuestName.value            = ''
  showGuestInput.value          = false
  guestError.value              = ''
}

function handleClose() {
  selectedFriendIds.value       = []
  selectedSearchUsers.value     = []
  friendRequestLoadingIds.value = []
  sentFriendRequestIds.value    = []
  searchQuery.value             = ''
  searchResults.value           = []
  guestNames.value              = []
  newGuestName.value            = ''
  showGuestInput.value          = false
  guestError.value              = ''
  emit('close')
}

function avatarLetter(person) {
  return (person.first_name?.[0] || person.username?.[0] || '?').toUpperCase()
}

const hasSelection = computed(() =>
  selectedFriendIds.value.length > 0 || selectedSearchUsers.value.length > 0 || guestNames.value.length > 0
)

const selectionCount = computed(() =>
  selectedFriendIds.value.length + selectedSearchUsers.value.length + guestNames.value.length
)
const remainingSlots = computed(() => props.maxAdditional - selectionCount.value)
const limitReached   = computed(() => remainingSlots.value <= 0)

// Liste unifiée de tout ce qui est actuellement sélectionné, affichée en haut du picker
const selectedPlayers = computed(() => {
  const friends = availableFriends.value
    .filter(f => selectedFriendIds.value.includes(f.id))
    .map(f => ({ kind: 'friend', key: `friend-${f.id}`, name: f.username || f.first_name || 'Ami', letter: avatarLetter(f), raw: f }))

  const searched = selectedSearchUsers.value
    .map(u => ({ kind: 'search', key: `search-${u.id}`, name: u.username || u.first_name || 'Joueur', letter: avatarLetter(u), raw: u }))

  const guests = guestNames.value
    .map((name, i) => ({ kind: 'guest', key: `guest-${i}`, name, index: i }))

  return [...friends, ...searched, ...guests]
})

function removeSelected(item) {
  if (item.kind === 'friend') toggleFriend(item.raw)
  else if (item.kind === 'search') toggleSearchResult(item.raw)
  else if (item.kind === 'guest') removeGuest(item.index)
}
</script>

<template>
  <AppModal :show="show" title="Ajouter des joueurs" size="lg" @close="handleClose">
    <div class="picker">

      <!-- Joueurs sélectionnés (tout en haut, tous types confondus) -->
      <div v-if="selectedPlayers.length" class="picker__section">
        <div class="picker__section-label">Joueurs sélectionnés</div>
        <div class="picker__list">
          <div v-for="item in selectedPlayers" :key="item.key" class="picker__item picker__item--guest">
            <div class="picker__avatar" :class="{ 'picker__avatar--guest': item.kind === 'guest' }">
              <AppIcon v-if="item.kind === 'guest'" name="user" :width="16" :height="16" />
              <template v-else>{{ item.letter }}</template>
            </div>
            <span class="picker__name">{{ item.name }}</span>
            <button class="picker__remove" @click="removeSelected(item)">
              <AppIcon name="close" :width="14" :height="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- Amis -->
      <div v-if="availableFriends.length" class="picker__section">
        <div class="picker__section-label">Amis</div>
        <div class="picker__list">
          <button
            v-for="friend in availableFriends"
            :key="friend.id"
            class="picker__item"
            :class="{ 'picker__item--selected': selectedFriendIds.includes(friend.id) }"
            :disabled="limitReached && !selectedFriendIds.includes(friend.id)"
            @click="toggleFriend(friend)"
          >
            <div class="picker__avatar">{{ avatarLetter(friend) }}</div>
            <div class="picker__info">
              <span class="picker__name">{{ friend.username || friend.first_name }}</span>
              <span class="picker__code">{{ friend.friend_code }}</span>
            </div>
            <div class="picker__check">
              <AppIcon v-if="selectedFriendIds.includes(friend.id)" name="check" :width="16" :height="16" />
            </div>
          </button>
        </div>
      </div>

      <div v-else-if="!friends.length" class="picker__empty">
        Tu n'as pas encore d'amis.<br>Ajoute-en depuis l'onglet Profil !
      </div>

      <!-- Recherche par pseudo -->
      <div class="picker__section">
        <div class="picker__section-label">Rechercher un joueur</div>
        <input
          v-model="searchQuery"
          class="picker__guest-input"
          placeholder="Pseudo..."
        />
        <p v-if="searchLoading" class="picker__search-status">Recherche...</p>
        <div v-else-if="searchQuery.trim().length >= 2 && !availableSearchResults.length" class="picker__search-status">
          Aucun joueur trouvé.
        </div>
        <div v-else-if="availableSearchResults.length" class="picker__list">
          <div v-for="user in availableSearchResults" :key="user.id" class="picker__item">
            <button class="picker__item-select" :disabled="limitReached" @click="toggleSearchResult(user)">
              <div class="picker__avatar">{{ avatarLetter(user) }}</div>
              <div class="picker__info">
                <span class="picker__name">{{ user.username || user.first_name }}</span>
              </div>
            </button>
            <button
              class="picker__friend-btn"
              :disabled="friendRequestLoadingIds.includes(user.id) || sentFriendRequestIds.includes(user.id)"
              @click="sendFriendRequest(user)"
            >
              <span v-if="sentFriendRequestIds.includes(user.id)">✓</span>
              <span v-else-if="friendRequestLoadingIds.includes(user.id)">…</span>
              <AppIcon v-else name="user-plus" :width="16" :height="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Ajouter invité -->
      <div class="picker__guest-add">
        <Transition name="slide-fade">
          <div v-if="showGuestInput" class="picker__guest-input-row">
            <input
              v-model="newGuestName"
              class="picker__guest-input"
              placeholder="Prénom ou pseudo"
              maxlength="20"
              @keyup.enter="addGuest"
            />
            <AppButton size="small" @click="addGuest">OK</AppButton>
          </div>
        </Transition>
        <p v-if="guestError" class="picker__guest-error">{{ guestError }}</p>
        <button
          v-if="!showGuestInput"
          class="picker__add-guest-btn"
          :disabled="limitReached"
          @click="showGuestInput = true"
        >
          + Ajouter un invité
        </button>
        <p v-if="limitReached" class="picker__search-status">Limite de joueurs atteinte.</p>
      </div>

      <!-- Confirmer -->
      <AppButton :disabled="!hasSelection" @click="confirm">
        Ajouter {{ hasSelection ? `(${selectedFriendIds.length + selectedSearchIds.length + guestNames.length})` : '' }}
      </AppButton>

    </div>
  </AppModal>
</template>

<style lang="scss" scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
  padding: $padding-md;

  &__section {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__section-label {
    @include title-sm;
    color: $muted;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $gap-xs;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    padding: $padding-sm $padding-md;
    border-radius: $radius-md;
    background: rgba($white, 0.05);
    border: $border-sm solid transparent;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    text-align: left;
    width: 100%;

    &--selected {
      background: rgba($orange, 0.15);
      border-color: $orange;
    }

    &--guest {
      cursor: default;
    }

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  &__avatar {
    width: 36px;
    height: 36px;
    border-radius: $radius-pill;
    background: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    @include title-sm;
    font-weight: 700;
    color: $white;
    flex-shrink: 0;

    &--guest {
      background: rgba($white, 0.15);
    }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__name {
    @include title-sm;
    color: $text-color;
    font-weight: 600;
  }

  &__code {
    @include text-xs;
    color: $muted;
  }

  &__check {
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $orange;
    flex-shrink: 0;
  }

  &__item-select {
    flex: 1;
    display: flex;
    align-items: center;
    gap: $gap-sm;
    min-width: 0;
    text-align: left;
    cursor: pointer;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }

  &__friend-btn {
    width: 32px;
    height: 32px;
    border-radius: $radius-pill;
    background: rgba($orange, 0.15);
    color: $orange;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    @include text-sm;
    transition: background 0.15s, opacity 0.15s;

    &:disabled { opacity: 0.4; }
    &:not(:disabled):active { background: rgba($orange, 0.25); }
  }

  &__remove {
    color: $muted;
    display: flex;
    align-items: center;
    padding: $padding-xs;

    &:active { opacity: 0.6; }
  }

  &__empty {
    @include text-sm;
    color: $muted;
    text-align: center;
    padding: $padding-lg 0;
    line-height: 1.6;
  }

  &__search-status {
    @include text-xs;
    color: $muted;
  }

  &__guest-error {
    @include text-xs;
    color: $error;
  }

  &__guest-add {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  &__guest-input-row {
    display: flex;
    gap: $gap-sm;
    align-items: center;
  }

  &__guest-input {
    flex: 1;
    background: rgba($white, 0.05);
    border: $border-md solid rgba($white, 0.15);
    border-radius: $radius-sm;
    color: $text-color;
    @include text-md;
    padding: $padding-xs $padding-sm;

    &:focus {
      outline: none;
      border-color: $orange;
    }
  }

  &__add-guest-btn {
    display: flex;
    align-items: center;
    gap: $gap-xs;
    @include text-sm;
    color: $muted;
    padding: $padding-xs 0;

    &:active { opacity: 0.7; }
    &:disabled { opacity: 0.4; }
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
