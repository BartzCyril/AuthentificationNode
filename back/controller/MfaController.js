const { authenticator } = require("otplib"); // Importation de otplib pour la gestion de l'authentification à deux facteurs
const qrcode = require("qrcode"); // Importation de qrcode pour générer des codes QR
const { getToken } = require("../helper/Jwt"); // Importation de la fonction getToken depuis le fichier helper/Jwt
const jwt = require('jsonwebtoken'); // Importation de jsonwebtoken pour la gestion des tokens JWT
require('dotenv').config(); // Chargement des variables d'environnement

authenticator.options = {
    ...authenticator.options,
    window: 2 // Configuration des options de l'authenticator
};

class MfaController {
    app = null; // Initialisation de la variable app à null
    Account = null; // Initialisation de la variable Account à null
    Token = null; // Initialisation de la variable Token à null

    constructor(app, Account, Token) { // Constructeur qui prend l'application, Account et Token en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.Account = Account; // Assignation de Account à l'instance
        this.Token = Token; // Assignation de Token à l'instance
        this.qrcode(); // Appel de la méthode qrcode pour définir la route QR code
        this.enableMfa(); // Appel de la méthode enableMfa pour définir la route d'activation MFA
        this.disableMfa(); // Appel de la méthode disableMfa pour définir la route de désactivation MFA
        this.checkMfaStatus(); // Appel de la méthode checkMfaStatus pour définir la route de vérification du statut MFA
        this.verifyOtp(); // Appel de la méthode verifyOtp pour définir la route de vérification OTP
    }

    async createMfa(email, res) { // Méthode pour créer un secret MFA et générer un code QR
        const secret = authenticator.generateSecret(); // Génération d'un secret MFA
        const updateMfaSecret = await this.Account.updateMfaSecret(email, secret); // Mise à jour du secret MFA dans la base de données

        if (updateMfaSecret.status !== 200) { // Si la mise à jour échoue
            res.status(updateMfaSecret.status).send({
                status: "Erreur",
                message: updateMfaSecret.message
            });
        } else {
            const otpKeyUri = authenticator.keyuri(email, process.env.APP_NAME, secret); // Génération de l'URI pour le code QR

            qrcode.toDataURL(otpKeyUri, (err, imageUrl) => { // Génération du code QR
                if (err) { // Gestion des erreurs
                    res.status(400).send({
                        status: "Erreur",
                        message: err
                    });
                    return;
                }
                res.status(200).send({
                    status: "Succès",
                    message: imageUrl
                });
            });
        }
    }

    qrcode() { // Méthode pour définir la route QR code
        this.app.post('/qrcode', async (req, res) => { // Définition de la route POST pour /qrcode
            const { email } = req.body; // Récupération de l'email depuis le corps de la requête

            const mfaSecret = await this.Account.getMfaSecret(email); // Obtention du secret MFA

            if (mfaSecret.status !== 200) { // Si la récupération échoue
                res.status(mfaSecret.status).send({
                    status: "Erreur",
                    message: mfaSecret.message
                });
            } else {
                if (mfaSecret.message !== null) { // Si un secret MFA existe déjà
                    res.status(500).send({
                        status: "Erreur",
                        message: 'Une clé secrète existe déjà pour cet utilisateur.'
                    });
                } else {
                    await this.createMfa(email, res); // Appel de la méthode createMfa pour créer un nouveau secret MFA
                }
            }
        });
    }

    verifyOtp() { // Méthode pour définir la route de vérification OTP
        this.app.post('/verifyOtp', async (req, res) => { // Définition de la route POST pour /verifyOtp
            const { email, otp } = req.body; // Récupération de l'email et de l'otp depuis le corps de la requête

            const mfasecret = await this.Account.getMfaSecret(email); // Obtention du secret MFA

            if (mfasecret.status !== 200) { // Si la récupération échoue
                res.status(mfasecret.status).send({
                    status: "Erreur",
                    message: mfasecret.message
                });
            } else {
                if (mfasecret.message === null) { // Si aucun secret MFA n'est trouvé
                    res.status(500).send({
                        status: "Erreur",
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                } else {
                    try {
                        if (!otp) { // Si l'otp n'est pas fourni
                            res.status(400).send({
                                status: "Erreur",
                                message: 'Le mot de passe unique n\'est pas fourni.'
                            });
                            return;
                        }
                        const isValid = authenticator.check(otp, mfasecret.message); // Vérification de l'otp
                        if (!isValid) { // Si l'otp est incorrect
                            res.status(200).send({
                                status: "Erreur",
                                message: 'Le mot de passe unique est incorrect.'
                            });
                            return;
                        }
                        const token = getToken(email, mfasecret.message); // Génération d'un nouveau token JWT
                        const getId = await this.Account.getId(email); // Obtention de l'ID du compte
                        if (getId.status !== 200) { // Si l'obtention de l'ID échoue
                            res.status(getId.status).send({
                                status: "Erreur",
                                message: getId.message
                            });
                        }
                        const insertToken = await this.Token.insertToken(getId.message, token); // Insertion du token dans la base de données
                        if (insertToken.status !== 200) { // Si l'insertion échoue
                            res.status(insertToken.status).send({
                                status: "Erreur",
                                message: insertToken.message
                            });
                        } else { // Si l'insertion réussit
                            res.status(200).send({
                                status: "Succès",
                                message: token
                            });
                        }
                    } catch (err) { // Gestion des erreurs
                        res.status(500).send({
                            status: "Erreur",
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }
                }
            }
        });
    }

    enableMfa() { // Méthode pour définir la route d'activation MFA
        this.app.post('/enable-mfa', async (req, res) => { // Définition de la route POST pour /enable-mfa
            const { email } = req.body; // Récupération de l'email depuis le corps de la requête
            const token = req.headers.token; // Récupération du token depuis les headers

            if (!token) { // Si aucun token n'est fourni
                res.status(400).send({ statut: "Erreur", message: "Le token doit être fourni" });
            }

            const mfaSecret = await this.Account.getMfaSecret(email); // Obtention du secret MFA

            if (mfaSecret.status !== 200) { // Si la récupération échoue
                return res.status(mfaSecret.status).send({
                    status: "Erreur",
                    message: mfaSecret.message
                });
            } else {
                if (mfaSecret.message !== null) { // Si un secret MFA existe déjà
                    return res.status(500).send({
                        status: "Erreur",
                        message: 'Une clé secrète existe déjà pour cet utilisateur.'
                    });
                } else {
                    const accountIdResponse = await this.Token.getAccountId(token); // Obtention de l'ID du compte à partir du token
                    if (accountIdResponse.status !== 200) { // Si l'obtention de l'ID échoue
                        return res.status(accountIdResponse.status).send({
                            status: "Erreur",
                            message: accountIdResponse.message
                        });
                    }

                    const id = accountIdResponse.message; // Extraction de l'ID du compte
                    const deleteTokensResponse = await this.Token.deleteAllToken(id); // Suppression de tous les tokens associés au compte
                    if (deleteTokensResponse.status !== 200) { // Si la suppression échoue
                        return res.status(deleteTokensResponse.status).send({
                            status: "Erreur",
                            message: deleteTokensResponse.message
                        });
                    }

                    const newToken = getToken(email, true); // Génération d'un nouveau token JWT
                    const insertToken = await this.Token.insertToken(id, newToken); // Insertion du nouveau token dans la base de données
                    if (insertToken.status !== 200) { // Si l'insertion échoue
                        return res.status(insertToken.status).send({
                            status: "Erreur",
                            message: insertToken.message
                        });
                    } else {
                        const secret = authenticator.generateSecret(); // Génération d'un nouveau secret MFA
                        const updateMfaSecret = await this.Account.updateMfaSecret(email, secret); // Mise à jour du secret MFA

                        if (updateMfaSecret.status !== 200) { // Si la mise à jour échoue
                            res.status(updateMfaSecret.status).send({
                                status: "Erreur",
                                message: updateMfaSecret.message
                            });
                        } else {
                            const otpKeyUri = authenticator.keyuri(email, process.env.APP_NAME, secret); // Génération de l'URI pour le code QR

                            qrcode.toDataURL(otpKeyUri, (err, imageUrl) => { // Génération du code QR
                                if (err) { // Gestion des erreurs
                                    res.status(400).send({
                                        status: "Erreur",
                                        message: err
                                    });
                                    return;
                                }
                                return res.status(200).send({
                                    status: "Succès",
                                    qrcode: imageUrl,
                                    token: newToken
                                });
                            });
                        }
                    }
                }
            }
        });
    }

    disableMfa() { // Méthode pour définir la route de désactivation MFA
        this.app.post('/disable-mfa', async (req, res) => { // Définition de la route POST pour /disable-mfa
            const { email } = req.body; // Récupération de l'email depuis le corps de la requête
            const token = req.headers.token; // Récupération du token depuis les headers

            if (!token) { // Si aucun token n'est fourni
                res.status(400).send({ statut: "Erreur", message: "Le token doit être fourni" });
            }

            const updateMfaSecret = await this.Account.deleteMfaSecret(email); // Suppression du secret MFA

            if (updateMfaSecret.status !== 200) { // Si la suppression échoue
                res.status(updateMfaSecret.status).send({
                    status: "Erreur",
                    message: updateMfaSecret.message
                });
            } else {
                const accountIdResponse = await this.Token.getAccountId(token); // Obtention de l'ID du compte à partir du token
                if (accountIdResponse.status !== 200) { // Si l'obtention de l'ID échoue
                    return res.status(accountIdResponse.status).send({
                        status: "Erreur",
                        message: accountIdResponse.message
                    });
                }

                const id = accountIdResponse.message; // Extraction de l'ID du compte
                const deleteTokensResponse = await this.Token.deleteAllToken(id); // Suppression de tous les tokens associés au compte
                if (deleteTokensResponse.status !== 200) { // Si la suppression échoue
                    return res.status(deleteTokensResponse.status).send({
                        status: "Erreur",
                        message: deleteTokensResponse.message
                    });
                }

                const newToken = getToken(email, null); // Génération d'un nouveau token JWT
                const insertToken = await this.Token.insertToken(id, newToken); // Insertion du nouveau token dans la base de données
                if (insertToken.status !== 200) { // Si l'insertion échoue
                    return res.status(insertToken.status).send({
                        status: "Erreur",
                        message: insertToken.message
                    });
                } else {
                    return res.status(200).send({
                        status: "Succès",
                        token: newToken
                    });
                }
            }
        });
    }

    checkMfaStatus() { // Méthode pour définir la route de vérification du statut MFA
        this.app.post('/check-mfa-status', async (req, res) => { // Définition de la route POST pour /check-mfa-status
            const { email } = req.body; // Récupération de l'email depuis le corps de la requête

            const mfaSecret = await this.Account.getMfaSecret(email); // Obtention du secret MFA

            if (mfaSecret.status !== 200) { // Si la récupération échoue
                res.status(mfaSecret.status).send({
                    status: "Erreur",
                    message: mfaSecret.message
                });
            } else {
                if (mfaSecret.message !== null) { // Si un secret MFA existe
                    res.status(mfaSecret.status).send({ status: "Succès", mfaEnabled: true });
                } else { // Si aucun secret MFA n'est trouvé
                    res.status(mfaSecret.status).send({ status: "Succès", mfaEnabled: false });
                }
            }
        });
    }
}

module.exports = MfaController; // Exportation de la classe MfaController pour utilisation externe
