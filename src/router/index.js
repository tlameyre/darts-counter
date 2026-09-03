import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/authStore.js";

import HomeView from "../views/HomeView.vue";
import LobbyView from "../views/LobbyView.vue";
import StatsView from "../views/StatsView.vue";
import StatsWarmupDetailView from "../views/StatsWarmupDetailView.vue";
import SettingsView from "../views/SettingsView.vue";
import GameView from "../views/GameView.vue";
import WarmupSettingsView from "../views/WarmupSettingsView.vue";
import WarmupGameView from "../views/WarmupGameView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import ProfileView from "../views/ProfileView.vue";
import ProfileEditView from "../views/ProfileEditView.vue";
import BadgesView from "../views/BadgesView.vue";
import X01SettingsView from "../views/X01SettingsView.vue";
import X01StarterOrderView from "../views/X01StarterOrderView.vue";
import X01GameView from "../views/X01GameView.vue";
import CheckoutSettingsView from "../views/CheckoutSettingsView.vue";
import CheckoutGameView from "../views/CheckoutGameView.vue";
import CheckoutWikiView from "../views/CheckoutWikiView.vue";
import CheckoutWikiDetailView from "../views/CheckoutWikiDetailView.vue";
import TacticsSettingsView from "../views/TacticsSettingsView.vue";
import TacticsStarterOrderView from "../views/TacticsStarterOrderView.vue";
import TacticsGameView from "../views/TacticsGameView.vue";
import FriendsView from "../views/FriendsView.vue";
import TournamentsView from "../views/TournamentsView.vue";
import TournamentSettingsView from "../views/TournamentSettingsView.vue";
import TournamentView from "../views/TournamentView.vue";
import TournamentJoinView from "../views/TournamentJoinView.vue";

const routes = [
  // Auth
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true },
  },
  {
    path: "/register",
    name: "register",
    component: RegisterView,
    meta: { public: true },
  },

  // App — onglets nav
  { path: "/", name: "home", component: HomeView },
  { path: "/play", name: "play", component: LobbyView },
  { path: "/stats", name: "stats", component: StatsView },
  { path: "/stats/warmup", name: "stats-warmup-detail", component: StatsWarmupDetailView },
  { path: "/friends", name: "friends", component: FriendsView },

  // App — autres
  { path: "/profile", name: "profile", component: ProfileView },
  { path: "/profile/edit", name: "profile-edit", component: ProfileEditView },
  { path: "/profile/badges", name: "badges", component: BadgesView },
  { path: "/score-training", name: "score-settings", component: SettingsView },
  {
    path: "/score-training/play",
    name: "score-game",
    component: GameView,
    meta: { hideNav: true },
  },
  { path: "/warmup", name: "warmup-settings", component: WarmupSettingsView },
  {
    path: "/warmup/play",
    name: "warmup-game",
    component: WarmupGameView,
    meta: { hideNav: true },
  },
  { path: "/501", name: "x01-settings", component: X01SettingsView },
  {
    path: "/501/starter",
    name: "x01-starter",
    component: X01StarterOrderView,
    meta: { hideNav: true },
  },
  {
    path: "/501/play",
    name: "x01-game",
    component: X01GameView,
    meta: { hideNav: true },
  },
  { path: "/checkouts", name: "checkout-settings", component: CheckoutSettingsView },
  { path: "/checkouts/wiki", name: "checkout-wiki", component: CheckoutWikiView },
  {
    path: "/checkouts/wiki/:score",
    name: "checkout-wiki-detail",
    component: CheckoutWikiDetailView,
    meta: { hideNav: true },
  },
  {
    path: "/checkouts/play",
    name: "checkout-game",
    component: CheckoutGameView,
    meta: { hideNav: true },
  },
  { path: "/tactics", name: "tactics-settings", component: TacticsSettingsView },
  {
    path: "/tactics/starter",
    name: "tactics-starter",
    component: TacticsStarterOrderView,
    meta: { hideNav: true },
  },
  {
    path: "/tactics/play",
    name: "tactics-game",
    component: TacticsGameView,
    meta: { hideNav: true },
  },
  { path: "/tournaments", name: "tournaments", component: TournamentsView },
  { path: "/tournaments/create", name: "tournament-settings", component: TournamentSettingsView },
  { path: "/tournaments/join/:code", name: "tournament-join", component: TournamentJoinView },
  { path: "/tournaments/:id", name: "tournament-detail", component: TournamentView },
];

// Route de dev — playground, accessible sans auth
// TODO: re-gater derrière import.meta.env.DEV avant la mise en prod
if (import.meta.env.DEV) {
  routes.push({
    path: "/dev",
    name: "dev",
    component: () => import("../views/DevView.vue"),
    meta: { dev: true },
  });
}

export const router = createRouter({
  history: createWebHistory("/darts-trainer/"),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 };
  },
});

router.beforeEach(async (to) => {
  if (to.meta.dev) return;

  const auth = useAuthStore();

  // Attendre la résolution de la session Supabase au premier chargement
  if (auth.loading) {
    await new Promise((resolve) => {
      const stop = setInterval(() => {
        if (!auth.loading) {
          clearInterval(stop);
          resolve();
        }
      }, 20);
    });
  }

  if (!to.meta.public && !auth.isAuth) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.public && auth.isAuth) {
    return { name: "home" };
  }
});
