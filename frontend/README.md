# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## Application PWA et mode hors ligne

La version de production est installable depuis le navigateur d’une tablette
(HTTPS requis en production; `localhost` est accepté en développement). Construire
et prévisualiser avec `npm run build` puis `npm run preview`.

Après une première connexion en ligne, l’utilisateur peut définir un PIN local.
Lors d’une ouverture ultérieure hors ligne, ce PIN déverrouille le profil déjà
utilisé sur cette tablette. Le PIN protège l’accès dans l’interface; les données
IndexedDB ne sont pas chiffrées et la tablette doit rester protégée par son
verrouillage système.

Les réponses JSON précédemment consultées sont conservées localement pour une
durée maximale de 30 jours. Les opérations prises en charge (présences,
épargnes, crédits, remboursements, pénalités, cotisations et demandes/décisions
d’aides sociales) sont enregistrées dans Dexie lorsqu’elles ne peuvent pas
atteindre le serveur. Elles sont envoyées dans l’ordre au retour du réseau avec
une clé d’idempotence. Les opérations refusées par une règle métier restent
conservées et sont signalées dans la barre d’état; elles ne sont pas supprimées
automatiquement. Si la session serveur a expiré, se reconnecter en ligne pour
reprendre la synchronisation.

La création hors ligne de données de référence (par exemple membres, cycles et
séances) n’est pas prise en charge : ces données doivent être créées en ligne
avant leur utilisation hors réseau.
