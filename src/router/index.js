import { createRouter, createWebHashHistory } from 'vue-router'

import LobbyView           from '../views/LobbyView.vue'
import SettingsView        from '../views/SettingsView.vue'
import GameView            from '../views/GameView.vue'
import WarmupSettingsView  from '../views/WarmupSettingsView.vue'
import WarmupGameView      from '../views/WarmupGameView.vue'

const routes = [
  {
    path:      '/',
    name:      'lobby',
    component: LobbyView,
  },

  // --- Score Training ---
  {
    path:      '/score-training',
    name:      'score-settings',
    component: SettingsView,
  },
  {
    path:      '/score-training/play',
    name:      'score-game',
    component: GameView,
  },

  // --- Echauffement ---
  {
    path:      '/warmup',
    name:      'warmup-settings',
    component: WarmupSettingsView,
  },
  {
    path:      '/warmup/play',
    name:      'warmup-game',
    component: WarmupGameView,
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
