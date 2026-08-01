<script setup>
import { watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppIconDefs from './components/AppIconDefs.vue'
import BottomNav from './components/BottomNav.vue'
import { useAuthStore } from './store/authStore.js'
import { useFriendStore } from './store/friendStore.js'
import { useTournamentStore } from './store/tournamentStore.js'

const router          = useRouter()
const route           = useRoute()
const authStore       = useAuthStore()
const friendStore     = useFriendStore()
const tournamentStore = useTournamentStore()

watch(() => authStore.isAuth, (val) => {
  if (route.meta.dev) return
  if (!val) {
    friendStore.unsubscribeFromFriendships()
    tournamentStore.unsubscribeFromMyParticipations()
    router.replace({ name: 'login' })
  } else {
    friendStore.fetchFriends()
    friendStore.subscribeToFriendships()
    tournamentStore.fetchMyParticipations()
    tournamentStore.subscribeToMyParticipations()
    if (route.meta.public) router.replace({ name: 'home' })
  }
})
</script>

<template>
  <AppIconDefs />
  <RouterView />
  <BottomNav v-if="authStore.isAuth && !route.meta.hideNav && !route.meta.public" />
</template>
