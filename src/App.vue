<script setup>
import { ref } from 'vue'
import LobbyView    from './views/LobbyView.vue'
import SettingsView from './views/SettingsView.vue'
import GameView     from './views/GameView.vue'

// 'lobby' | 'settings' | 'game'
const screen       = ref('lobby')
const selectedMode = ref(null)
const gameSettings = ref(null)

function selectMode(mode) {
  selectedMode.value = mode
  screen.value = 'settings'
}

function startGame(settings) {
  gameSettings.value = settings
  screen.value = 'game'
}

function goToLobby() {
  screen.value = 'lobby'
  selectedMode.value = null
  gameSettings.value = null
}

function goToSettings() {
  screen.value = 'settings'
  gameSettings.value = null
}

function replay() {
  // Relancer le jeu avec les mêmes settings
  screen.value = 'game'
}
</script>

<template>
  <LobbyView
    v-if="screen === 'lobby'"
    @select="selectMode"
  />

  <SettingsView
    v-else-if="screen === 'settings'"
    :mode="selectedMode"
    @start="startGame"
    @back="goToLobby"
  />

  <GameView
    v-else-if="screen === 'game'"
    :key="JSON.stringify(gameSettings)"
    :settings="gameSettings"
    @home="goToLobby"
    @back="goToSettings"
    @replay="replay"
  />
</template>
