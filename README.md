# DevAuth — plateforme de blogs sécurisée

> Plateforme de blogging construite autour de l'authentification : connexion classique ou via Google / Discord, double authentification obligatoire pour publier, sessions JWT multi-appareils révocables et service d'images sécurisé par OAuth2.

![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)

**👉 Voir le site : [auth.qota7916.odns.fr](https://auth.qota7916.odns.fr)**

## Sujet

Projet de formation réalisé en équipe (sujet : [Projet DevAuth.pdf](Projet%20DevAuth.pdf)). Le but était de développer une plateforme de blogs complète en faisant de la sécurité des accès et de la protection des données utilisateur le cœur du projet.

## Fonctionnalités

- **Inscription et connexion** par e-mail / mot de passe (haché avec bcrypt) ou via **Google** et **Discord** (OAuth2 avec Passport)
- **Double authentification (2FA)** par TOTP : génération d'un QR code à scanner avec Google Authenticator, activation / désactivation, vérification du code
- **Actions sensibles protégées** : la création, la modification et la suppression d'articles exigent que la 2FA soit activée
- **Sessions JWT multi-appareils** : chaque connexion a son propre token enregistré en base, ce qui permet de rester connecté sur mobile et ordinateur en même temps
- **Déconnexion de tous les appareils** en un clic (révocation de tous les tokens du compte)
- **Blogs publics ou privés** : le serveur vérifie les droits avant d'afficher ou de modifier un blog
- **Images d'articles** stockées par un service séparé : l'envoi d'une image n'est accepté qu'avec un token OAuth2 délivré par un serveur d'autorisation dédié

## Architecture

| Service | Port | Rôle |
| --- | --- | --- |
| `client/` | 5173 | Interface React + TypeScript (Vite) |
| `back/` | 3000 | API principale : comptes, blogs, articles, 2FA, connexion Google / Discord |
| `oauth2/` | 3002 | Serveur d'autorisation OAuth2 (`client_credentials`) qui délivre les tokens d'accès |
| `image/` | 3001 | Stockage des images d'articles ; l'envoi est protégé par token OAuth2 |

Chaque service a sa propre base SQLite.

## Compétences acquises

- **Authentification** : hachage des mots de passe, JWT, gestion des tokens en base pour permettre la révocation
- **OAuth2 côté client** : connexion via des fournisseurs externes (Google, Discord) avec Passport.js
- **OAuth2 côté serveur** : mise en place d'un serveur d'autorisation (`@node-oauth/oauth2-server`) et protection d'un service par token
- **2FA TOTP** avec `otplib` et génération de QR codes
- **Contrôle d'accès** : distinction contenu public / privé, vérification systématique des droits côté serveur
- **Découpage en services** qui communiquent entre eux (API, autorisation, stockage de fichiers)
- **Front-end React / TypeScript** : contexte d'authentification, routes protégées, modales de 2FA et de déconnexion

## Lancer le projet en local

Prérequis : Node.js 18 ou plus récent. Chaque service se lance dans son propre terminal.

### 1. Variables d'environnement de l'API

```bash
cp back/.env.example back/.env
```

Renseigner `SECRET_KEY` (clé de signature JWT), `APP_NAME`, ainsi que les identifiants des applications OAuth Google (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) et Discord (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`).

### 2. Démarrer les services

```bash
cd back   && npm install && npm start   # API          → http://localhost:3000
cd oauth2 && npm install && npm start   # OAuth2       → http://localhost:3002
cd image  && npm install && npm start   # Images       → http://localhost:3001
cd client && npm install && npm start   # Interface    → http://localhost:5173
```
