/**
 * Définition des modes de jeu.
 * Pour ajouter un mode : ajouter un objet ici + les routes dans router/index.js
 */
export const GAME_MODES = [
  {
    id:            'score-training',
    title:         'ENTRAINEMENT\nSCORE',
    description:   'Calcule le total de ta volée et entraîne-toi à compter rapidement.',
    color:         '#D64A24',
    settingsRoute: 'score-settings',
  },
  {
    id:            'warmup',
    title:         'ECHAUFFEMENT',
    description:   'Travaille une zone de la cible sur une durée définie et suis ta précision.',
    color:         '#1D4ED8',
    settingsRoute: 'warmup-settings',
  },
]
