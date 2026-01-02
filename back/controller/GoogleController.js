
const passport = require('passport'); // Importation de passport pour l'authentification
const GoogleStrategy = require('passport-google-oauth20').Strategy; // Importation de la stratégie Google OAuth 2.0
const {sign} = require("jsonwebtoken");

class GoogleController {
    app = null; // Initialisation de la variable app à null
    oauth = null; // Initialisation de la variable oauth à null
    account = null; // Initialisation de la variable account à null

    constructor(app, oauth, account) { // Constructeur qui prend l'application, oauth et account en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.oauth = oauth; // Assignation de oauth à l'instance
        this.account = account; // Assignation de account à l'instance
        this.app.use(passport.initialize()); // Initialisation de passport
        this.discordStrategy(); // Appel de la méthode discordStrategy pour configurer la stratégie OAuth
        this.google(); // Appel de la méthode google pour définir la route Google OAuth
        this.googleCallback(); // Appel de la méthode googleCallback pour définir la route de callback Google OAuth
    }

    discordStrategy() { // Méthode pour configurer la stratégie Google OAuth
        passport.use(new GoogleStrategy({
                clientID: process.env.GOOGLE_CLIENT_ID, // ID client Google
                clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Secret client Google
                callbackURL: process.env.GOOGLE_REDIRECT_URI, // URL de redirection Google
            },
            async (accessToken, refreshToken, profile, cb) => { // Fonction de vérification de la stratégie Google
                const getOAuth = await this.oauth.getOAuth(profile.id, null); // Obtention des informations OAuth

                if (getOAuth.status !== 200) { // Si l'obtention échoue
                    cb(null, false);
                } else {
                    if (!getOAuth.message) { // Si l'utilisateur n'existe pas, le créer
                        const insertEmail = await this.account.insertEmail(profile.emails[0].value); // Insertion de l'email dans la table account
                        if (insertEmail.status !== 200) {
                            cb(null, false);
                        } else {
                            const insertOAuth = await this.oauth.insert(insertEmail.message, profile.id, profile.provider); // Insertion des informations OAuth
                            if (insertOAuth.status !== 200) {
                                cb(null, false);
                            } else {
                                cb(null, { // Utilisateur créé avec succès
                                    register: true,
                                    email: profile.emails[0].value
                                });
                            }
                        }
                    } else { // L'utilisateur existe déjà
                        cb(null, {
                            register: false,
                            email: profile.emails[0].value
                        });
                    }
                }
            }));
    }

    google() { // Méthode pour définir la route Google OAuth
        this.app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    }

    googleCallback() { // Méthode pour définir la route de callback Google OAuth
        this.app.get('/google/callback',
            passport.authenticate('google', { failureRedirect: 'http://localhost:5173', session: false }),
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

module.exports = GoogleController; // Exportation de la classe GoogleController pour utilisation externe
