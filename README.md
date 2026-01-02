# Authentification

## Compétences acquises

Ce projet consistait à développer une plateforme de blogging complète, avec pour objectif principal de maîtriser la sécurité des accès et la protection des données utilisateurs.

Nous avons appris à implémenter des systèmes d'authentification modernes. Nous avons mis en place une inscription flexible permettant l'utilisation d'email ou de fournisseurs externes (Google, GitHub, etc.) via le protocole OAuth2. Pour renforcer la sécurité des comptes, nous avons intégré une authentification à deux facteurs (2FA) via Google Authenticator, indispensable pour effectuer des actions critiques comme la publication de contenu.

La gestion des sessions a été un point clé de notre apprentissage. En utilisant des tokens JWT, nous avons permis aux utilisateurs de rester connectés sur plusieurs appareils en même temps (mobile et ordinateur). Nous avons également conçu un mécanisme de sécurité permettant de révoquer toutes les connexions d'un coup en cas de besoin.

Enfin, ce projet nous a permis de gérer finement les permissions d'accès. Nous avons dû structurer l'application pour distinguer les espaces publics des blogs privés, en nous assurant que le serveur vérifie systématiquement les droits de l'utilisateur avant d'afficher ou de modifier des données.

Voici quelques instructions pour vous aider à utiliser notre projet.

## Installer les dépendances pour le serveur back, client, oauth2 et image

```shell
npm i
```

## Lancer le serveur back, client, oauth2 et image

```shell
npm start
```

