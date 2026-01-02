const { getToken, expTokenVerification } = require("../helper/Jwt"); // Importation des fonctions getToken et expTokenVerification depuis le fichier helper/Jwt
const bcrypt = require('bcrypt');
const {del} = require("express/lib/application"); // Importation de bcrypt pour le hachage des mots de passe

class AccountController {
    app = null; // Initialisation de la variable app à null
    Account = null; // Initialisation de la variable Account à null
    Token = null; // Initialisation de la variable Token à null

    constructor(app, Account, Token) { // Constructeur qui prend l'application, Account et Token en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.Account = Account; // Assignation de Account à l'instance
        this.Token = Token; // Assignation de Token à l'instance
        this.register(); // Appel de la méthode register pour définir la route de création de compte
        this.accountId(); // Appel de la méthode accountId pour définir la route de récupération de l'ID du compte
        this.login(); // Appel de la méthode login pour définir la route de connexion
        this.update(); // Appel de la méthode update pour définir la route de modification de compte
        this.verify(); // Appel de la méthode verify pour définir la route de vérification du token
        this.logout(); // Appel de la méthode logout pour définir la route de déconnexion
    }

    /**
     * Cette route permet de créer un compte
     * @param req {Object} La requête.
     * @param res {Object} La réponse.
     * @param req.body {Object} Les données de la requête.
     * @param req.body.email {string} L'email du compte.
     * @param req.body.motdepasse {string} Le mot de passe du compte.
     * @return Promise<{
     * status: string,
     * message: string
     * }>
     */
    register() { // Méthode pour définir la route de création de compte
        this.app.post('/register', async (req, res) => { // Définition de la route POST pour /register
            const { email, password } = req.body; // Récupération de l'email et du mot de passe depuis le corps de la requête
            if (email && password) { // Vérification si l'email et le mot de passe sont définis
                const regexEmail = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g; // Expression régulière pour valider l'email
                if (!email.match(regexEmail)) { // Vérification si l'email correspond à l'expression régulière
                    console.log("L'identifiant n'est pas un email"); // Affichage d'un message d'erreur dans la console
                    res.status(501).send({ status: "Erreur", message: "L'identifiant doit être un mail correct." }); // Envoi d'une réponse d'erreur
                    return;
                }

                const insert = await this.Account.insertEmailAndPassword(email, password); // Insertion de l'email et du mot de passe dans la base de données
                console.log(insert); // Affichage du résultat de l'insertion dans la console
                res.status(insert.status).send({ // Envoi de la réponse avec le statut et le message
                    status: insert.status === 200 ? "Succès" : "Erreur",
                    message: insert.message
                });
            } else { // Si l'email ou le mot de passe n'est pas défini
                res.status(400).send({ // Envoi d'une réponse d'erreur
                    status: "Erreur",
                    message: "L'email ou le mot de passe n'est pas défini."
                });
            }
        });
    }

    /**
     * Cette route permet de modifier un champ d'un compte
     * @param req {Object} La requête.
     * @param res {Object} La réponse.
     * @param req.query.id {string} L'email du compte.
     * @param req.body {Object} Les données de la requête.
     * @param req.body.email {string} L'email du compte.
     * @param req.body.motdepasse {string} Le mot de passe du compte.
     * @return Promise<{
     * status: string,
     * message: string
     * }>
     */
    update() { // Méthode pour définir la route de modification de compte
        this.app.patch('/update', (req, res) => { // Définition de la route PATCH pour /update
            const id = req.query.id; // Récupération de l'ID depuis les paramètres de la requête
            const { email, password } = req.body; // Récupération de l'email et du mot de passe depuis le corps de la requête

            if (!id) { // Si l'ID n'est pas fourni
                res.status(400).send({ status: "Erreur", message: "L'id doit être fourni" }); // Envoi d'une réponse d'erreur
                return;
            }

            if (!email && password) { // Si seul le mot de passe est fourni
                this.Account.updatePassword(id, password).then((result) => { // Mise à jour du mot de passe
                    res.status(result.status).send({ // Envoi de la réponse avec le statut et le message
                        status: result.status === 200 ? "Succès" : "Erreur",
                        message: result.message
                    });
                });
            } else if (email && !password) { // Si seul l'email est fourni
                this.Account.updateEmail(id, email).then((result) => { // Mise à jour de l'email
                    res.status(result.status).send({ // Envoi de la réponse avec le statut et le message
                        status: result.status === 200 ? "Succès" : "Erreur",
                        message: result.message
                    });
                });
            } else { // Si ni l'email ni le mot de passe ne sont définis
                res.status(400).send({ status: "Erreur", message: "L'email ou le mot de passe n'est pas défini" }); // Envoi d'une réponse d'erreur
            }
        });
    }

    /**
     * Cette route permet de récupérer l'id d'un compte
     * @param req {Object} La requête.
     * @param res {Object} La réponse.
     * @param req.query.email {string} L'email du compte.
     * @return Promise<{
     * status: string,
     * message: string
     * }>
     */
    accountId() { // Méthode pour définir la route de récupération de l'ID du compte
        this.app.get("/accountId", async (req, res) => { // Définition de la route GET pour /accountId
            const email = req.query.email; // Récupération de l'email depuis les paramètres de la requête
            if (!email) { // Si l'email n'est pas défini
                res.status(400).send({ status: "Erreur", message: "L'email n'est pas défini" }); // Envoi d'une réponse d'erreur
                return;
            }

            const getId = await this.Account.getId(email); // Récupération de l'ID du compte

            if (getId.status !== 200) { // Si la récupération échoue
                res.status(getId.status).send({ // Envoi de la réponse avec le statut et le message
                    status: "Erreur",
                    message: getId.message
                });
            } else { // Si la récupération réussit
                if (typeof getId.message === "string") { // Si le message est une chaîne de caractères
                    res.status(404).send({ // Envoi d'une réponse d'erreur
                        status: "Erreur",
                        message: getId.message
                    });
                } else { // Si le message n'est pas une chaîne de caractères
                    res.status(200).send({ // Envoi de la réponse avec le statut et le message
                        status: "Succès",
                        message: getId.message
                    });
                }
            }
        });
    }

    /**
     * Cette route permet de se connecter
     * @param req {Object} La requête.
     * @param res {Object} La réponse.
     * @param req.body {Object} Les données de la requête.
     * @param req.body.email {string} L'email du compte.
     * @param req.body.motdepasse {string} Le mot de passe du compte.
     * @return Promise<{
     * status: string,
     * message: string
     * }>
     */
    login() { // Méthode pour définir la route de connexion
        this.app.post('/login', async (req, res) => { // Définition de la route POST pour /login
            const { email, password } = req.body; // Récupération de l'email et du mot de passe depuis le corps de la requête
            if (email && password) { // Si l'email et le mot de passe sont définis
                const regexEmail = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g; // Expression régulière pour valider l'email
                if (!email.match(regexEmail)) { // Vérification si l'email correspond à l'expression régulière
                    console.log("L'identifiant n'est pas un email"); // Affichage d'un message d'erreur dans la console
                    res.status(501).send({ status: "Erreur", message: "L'identifiant doit être un mail correct." }); // Envoi d'une réponse d'erreur
                    return;
                }

                const getPasswordAndMfaSecret = await this.Account.getPasswordAndMfaSecret(email); // Récupération du mot de passe et du secret MFA

                if (getPasswordAndMfaSecret.status !== 200) { // Si la récupération échoue
                    res.status(getPasswordAndMfaSecret.status).send({ // Envoi de la réponse avec le statut et le message
                        status: "Erreur",
                        message: getPasswordAndMfaSecret.message
                    });
                } else {
                    if (getPasswordAndMfaSecret.message === null) { // Si l'email est incorrect
                        res.status(404).send({ // Envoi d'une réponse d'erreur
                            status: "Erreur",
                            message: "L'email est incorrect"
                        });
                    } else {
                        const row = getPasswordAndMfaSecret.message.password; // Récupération du mot de passe haché

                        const compare = await bcrypt.compare(password, row.toString()); // Comparaison des mots de passe
                        if (compare !== true) { // Si le mot de passe est incorrect
                            res.status(401).send({ // Envoi d'une réponse d'erreur
                                status: "Erreur",
                                message: "Le mot de passe est incorrect"
                            });
                            return;
                        }

                        let token = null;

                        if (getPasswordAndMfaSecret.message['mfaSecret'] === null) { // Si le secret MFA est null
                            token = getToken(email, null); // Génération d'un token JWT
                            const getId = await this.Account.getId(email); // Récupération de l'ID du compte
                            if (getId.status !== 200) { // Si la récupération échoue
                                res.status(getId.status).send({ // Envoi de la réponse avec le statut et le message
                                    status: "Erreur",
                                    message: getId.message
                                });
                            }
                            const insertToken = await this.Token.insertToken(getId.message, token); // Insertion du token dans la base de données
                            if (insertToken.status !== 200) { // Si l'insertion échoue
                                res.status(insertToken.status).send({ // Envoi de la réponse avec le statut et le message
                                    status: "Erreur",
                                    message: insertToken.message
                                });
                            }
                        }

                        res.status(200).send({ // Envoi de la réponse avec le statut et le token
                            status: "Succès",
                            message: token
                        });

                    }
                }
            } else { // Si l'email ou le mot de passe n'est pas défini
                res.status(400).send({ status: "Erreur", message: "L'email ou le mot de passe n'est pas défini" }); // Envoi d'une réponse d'erreur
            }
        });
    }

    /**
     * Cette route permet de vérifier si un token est valide
     * @param req {Object} La requête.
     * @param res {Object} La réponse.
     * @param req.headers.token {string} Le token du compte.
     * @return Promise<{
     * status: string,
     * message: string
     * } | {
     *     status: string,
     *     message: string,
     *     utilisateur: {
     *     email: string
     *     }
     * }>
     */
    verify() { // Méthode pour définir la route de vérification du token
        this.app.post('/verify', (req, res) => { // Définition de la route POST pour /verify
            const token = req.headers.token; // Récupération du token depuis les headers

            if (!token) { // Si aucun token n'est fourni
                res.status(400).send({ statut: "Erreur", message: "Le token doit être fourni" }); // Envoi d'une réponse d'erreur
            }
            expTokenVerification(token, req) // Vérification du token
                .then(async (email) => { // Si la vérification réussit

                    const getMfaSecret = await this.Account.getMfaSecret(email); // Récupération du secret MFA

                    if (getMfaSecret.status !== 200) { // Si la récupération échoue
                        res.status(getMfaSecret.status).send({ // Envoi de la réponse avec le statut et le message
                            status: "Erreur",
                            message: getMfaSecret.message
                        });
                    } else {
                        res.status(200).send({ // Envoi de la réponse avec le statut, le message, et l'état OTP
                            status: "Succès",
                            message: 'Token valide.',
                            otp: getMfaSecret.message !== null,
                            user: email
                        });
                    }
                })
                .catch(async (err) => { // Si la vérification échoue
                    console.error(`Erreur verification token : ${err.message}`); // Affichage de l'erreur dans la console
                    res.status(401).send({ status: "Erreur", message: err.message }); // Envoi d'une réponse d'erreur
                });
        });
    }

    /**
     * Cette route permet de se déconnecter
     * @param req {Object} La requête.
     * @param res {Object} La réponse.
     * @param req.headers.token {string} Le token du compte.
     * @return Promise<{
     * status: string,
     * message: string
     * }>
     */
    logout() {
        this.app.get('/logout', async (req, res) => {
            try {
                const { token, all } = req.query; // Récupération des paramètres token et all depuis la requête

                if (!token) { // Vérification si le token est présent
                    return res.status(401).send({ status: "Erreur", message: "Jeton inconnu" });
                }

                if (typeof all === "undefined") { // Vérification si le paramètre all est présent
                    return res.status(400).send({ status: "Erreur", message: "Paramètre 'all' manquant" });
                }

                if (all === "false") { // Si all est false, supprimer uniquement le token actuel
                    const deleteToken = await this.Token.deleteToken(token); // Suppression du token
                    if (deleteToken.status !== 200) { // Si la suppression échoue
                        return res.status(deleteToken.status).send({
                            status: "Erreur",
                            message: deleteToken.message
                        });
                    }
                    return res.status(200).send({ status: "Succès", message: "Déconnexion réussie" }); // Si la suppression réussit
                }

                const getAccountId = await this.Token.getAccountId(token); // Obtention de l'ID du compte à partir du token

                if (getAccountId.status !== 200) { // Si l'obtention de l'ID échoue
                    return res.status(getAccountId.status).send({
                        status: "Erreur",
                        message: getAccountId.message
                    });
                }

                const deleteAllToken = await this.Token.deleteAllToken(getAccountId.message); // Suppression de tous les tokens associés au compte
                if (deleteAllToken.status !== 200) { // Si la suppression échoue
                    return res.status(deleteAllToken.status).send({
                        status: "Erreur",
                        message: deleteAllToken.message
                    });
                }

                return res.status(200).send({ status: "Succès", message: "Déconnexion réussie" }); // Si la suppression réussit
            } catch (error) { // Gestion des erreurs
                console.error("Error during logout:", error);
                return res.status(500).send({ status: "Erreur", message: "Erreur interne du serveur" });
            }
        });
    }
}

module.exports = AccountController; // Exportation de la classe AccountController pour utilisation externe