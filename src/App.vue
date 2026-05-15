<script setup>
import { ref, shallowRef } from 'vue'
import HomeView from './views/HomeView.vue'
import GameView from './views/GameView.vue'

const currentView = shallowRef('home')
const gameSettings = ref(null)

function startGame(settings) {
  gameSettings.value = settings
  currentView.value = 'game'
}

function goHome() {
  currentView.value = 'home'
  gameSettings.value = null
}
</script>

<template>
  <HomeView
    v-if="currentView === 'home'"
    @start="startGame"
  />
  <GameView
    v-else-if="currentView === 'game'"
    :key="JSON.stringify(gameSettings)"
    :settings="gameSettings"
    @home="goHome"
    @replay="startGame(gameSettings)"
  />
</template>
