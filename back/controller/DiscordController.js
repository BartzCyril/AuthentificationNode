const DiscordStrategy = require('passport-discord').Strategy;
const scopes = ['identify', 'email', 'guilds', 'guilds.join'];
const passport = require('passport');
const {sign} = require("jsonwebtoken");

class DiscordController {
    app = null; // Initialisation de la variable app à null
    oauth = null; // Initialisation de la variable oauth à null
    account = null; // Initialisation de la variable account à null

    constructor(app, oauth, account) { // Constructeur qui prend l'application, oauth et account en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.oauth = oauth; // Assignation de oauth à l'instance
        this.account = account; // Assignation de account à l'instance
        this.app.use(passport.initialize()); // Initialisation de passport
        this.discordStrategy(); // Appel de la méthode discordStrategy pour configurer la stratégie OAuth
        this.discord(); // Appel de la méthode discord pour définir la route Discord OAuth
        this.discordCallback(); // Appel de la méthode discordCallback pour définir la route de callback Discord OAuth
    }

    discordStrategy() { // Méthode pour configurer la stratégie Discord OAuth
        passport.use(new DiscordStrategy({
                clientID: process.env.DISCORD_CLIENT_ID, // ID client Discord
                clientSecret: process.env.DISCORD_CLIENT_SECRET, // Secret client Discord
                callbackURL: process.env.DISCORD_REDIRECT_URI, // URL de redirection Discord
                scope: scopes // Scopes pour la stratégie Discord OAuth
            },
            async (accessToken, refreshToken, profile, cb) => { // Fonction de vérification de la stratégie Discord
                const getOAuth = await this.oauth.getOAuth(profile.id, null); // Obtention des informations OAuth

                if (getOAuth.status !== 200) { // Si l'obtention échoue
                    cb(null, false);
                } else {
                    if (!getOAuth.message) { // Si l'utilisateur n'existe pas, le créer
                        const insertEmail = await this.account.insertEmail(profile.email); // Insertion de l'email dans la table account
                        if (insertEmail.status !== 200) {
                            cb(null, false);
                        } else {
                            const insertOAuth = await this.oauth.insert(insertEmail.message, profile.id, profile.provider); // Insertion des informations OAuth
                            if (insertOAuth.status !== 200) {
                                cb(null, false);
                            } else {
                                cb(null, { // Utilisateur créé avec succès
                                    register: true,
                                    email: profile.email
                                });
                            }
                        }
                    } else { // L'utilisateur existe déjà
                        cb(null, {
                            register: false,
                            email: profile.email
                        });
                    }
                }
            }));
    }

    discord() { // Méthode pour définir la route Discord OAuth
        this.app.get('/discord', passport.authenticate('discord'));
    }

    discordCallback() { // Méthode pour définir la route de callback Discord OAuth
        this.app.get('/discord/callback',
            passport.authenticate('discord', { failureRedirect: 'http://localhost:5173', session: false }),
            function (req, res) { // Fonction de redirection après authentification
                if (req.user) {
                    const token = sign({
                        register: req.user.register,
                        email: req.user.email
                    }, process.env.SECRET_KEY, { expiresIn: '1h' });
                    res.redirect("http://localhost:5173/login?token=" + token);
                } else {
                    res.redirect("http://localhost:5173");
                }
            });
    }
}

module.exports = DiscordController; // Exportation de la classe DiscordController pour utilisation externe
