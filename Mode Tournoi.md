# Mode Tournoi — récapitulatif des décisions

## Commun à tous les formats

- Chaque match = X01 classique existant (`useX01`, système de legs), **pas de notion de sets**. `legsToWin` défini une fois à la création du tournoi, appliqué à tous les matchs.
- Roster : réutilise le picker actuel (amis / utilisateurs inscrits / invités), **sans le plafond de 4** actuel. Min/max par format (voir ci-dessous).
- **Persistance Supabase** : l'état du tournoi (poule/bracket/championnat en cours, matchs joués, classement) est sauvegardé en base, reprise possible après fermeture de l'appli.
- Choix du format à la création du tournoi : Round Robin, Bracket, ou Championnat.

---

## 1. Round Robin (poule)

- Tout le monde joue tout le monde.
- **Aller/retour** : paramètre optionnel (simple ou double round robin).
- **Points** : victoire = 2 pts / défaite à 1 leg d'écart = 1 pt / défaite plus large = 0 pt.
- Classement affiche aussi la **différence de legs gagnés/perdus**.
- **Départage en cas d'égalité de points**, dans l'ordre :
  1. Différence de legs (globale)
  2. Confrontation directe
  3. Différence de legs sur la confrontation directe
- Min conseillé : 3 joueurs. Pas de max strict.

---

## 2. Bracket (élimination)

- **Bye automatique** si le nombre de joueurs n'est pas une puissance de 2.
- **Loser bracket** : option (double élimination activable ou non).
- **Seeding** : au choix — aléatoire ou manuel (pas de seeding basé sur classement/stats).
- Min conseillé : 4 joueurs. Pas de max strict (ex. jusqu'à 32).

---

## 3. Championnat (façon Premier League Darts)

- Composé de **plusieurs étapes**, déclenchées manuellement — pas de calendrier daté, il faut juste terminer une étape pour débloquer la suivante.
- **Nombre d'étapes qualificatives : paramétrable** à la création.
- **Format de l'étape : paramétrable**, deux options :
  - **Bracket** (par défaut, façon soirée PL Darts) : cible **8 joueurs**, élimination directe uniquement, pas de loser bracket, seeding aléatoire fixe (pas manuel). Si le groupe de l'étape a **moins de 8 joueurs** (ex. championnat à 6), le bracket **reste structuré à 8 emplacements** (3 tours : quart/demi/finale) et complète avec des **byes** — les joueurs exemptés passent direct en demi. Le barème 5/3/2/0 reste inchangé.
    - **Équité des byes obligatoire** : un joueur en bye saute le quart (0 match joué) puis peut gagner autant de points en perdant sa demi qu'un joueur ayant joué et gagné son quart puis perdu sa demi — c'est un avantage structurel du bye. Pour ne pas favoriser toujours les mêmes joueurs, le système **doit répartir les byes équitablement dans le temps** : il retient qui a déjà eu un bye aux étapes précédentes et priorise les joueurs qui n'en ont pas encore eu.
  - **Round Robin** (façon journée de championnat de foot) : l'étape est une série de matchs en poule entre tous les participants de l'étape, au lieu d'un bracket — chaque étape correspond à une "journée". Points de l'étape = système classique Round Robin (victoire 2 pts / défaite à 1 leg d'écart 1 pt / défaite plus large 0 pt).
- **Barème de points par étape en mode Bracket** (fixe, format 8 joueurs) :
  - Vainqueur de la soirée : **5 pts**
  - Finaliste (2e place) : **3 pts**
  - Perdants demi-finale (3e/4e places) : **2 pts**
  - Éliminés en quart de finale : **0 pt**
- **Classement final** = cumul des points sur toutes les étapes qualificatives.
- **Grande finale** : bracket (élimination directe) entre les meilleurs du cumul, taille déterminée par l'effectif total du championnat :
  - 4 à 8 participants → **top 4** en grande finale
  - 9 à 16 participants → **top 8** en grande finale
- Effectif : **min 4, max 16** joueurs (pour le moment).

---

## Points encore ouverts (à trancher en phase de conception technique)

- Modèle de données Supabase : nouvelles tables tournoi/étapes/matchs, lien avec `x01_sessions` existant
- Écrans/UX : création tournoi, vue bracket/poule/championnat, déclenchement d'étape, reprise d'un tournoi en cours
