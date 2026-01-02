const jwt = require('jsonwebtoken'); // Importation de jsonwebtoken pour la gestion des tokens JWT

const Jwt = {
    getToken: (email, mfaSecret) => { // Fonction pour générer un token JWT
        return jwt.sign(
            {
                email: email, // Payload contenant l'email
                exp: Date.now() + (1000 * 60 * 10), // Expiration dans 10 minutes
                otp: mfaSecret !== null // Indicateur si le secret MFA est présent
            },
            process.env.SECRET_KEY // Clé secrète pour signer le token
        );
    },

    /**
     * Fonction pour vérifier si un token est valide
     * @param {string} jeton - Le token JWT à vérifier
     * @param {Object} req - La requête
     * @throws {Promise<Error>} Si le token est invalide ou si l'utilisateur n'est pas trouvé
     * @return {Promise<string>} Une promesse qui résout avec l'email du compte
     */
    expTokenVerification(jeton, req) {
        return new Promise(async (resolve, reject) => { // Renvoie une promesse
            try {
                const token = jwt.verify(jeton, process.env.SECRET_KEY); // Vérification du token avec la clé secrète

                if (!token.iat || !token.exp || !token.email) { // Vérification des éléments du token
                    return reject(new Error("Element manquant dans le token"));
                }
                if (new Date(token.iat) > new Date(Date.now())) { // Vérification de la date de création
                    return reject(new Error("La date de création doit être inférieure à l'heure actuelle"));
                }
                if (new Date(token.exp) < new Date(Date.now())) { // Vérification de la date d'expiration
                    return reject(new Error("La date d'expiration doit être supérieure à l'heure actuelle"));
                }
                if (new Date(token.iat) > new Date(token.exp)) { // Vérification de la cohérence des dates
                    return reject(new Error("La date d'expiration doit être supérieure à la date de création"));
                }

                const email = token.email; // Extraction de l'email du token

                const sql = req.db.prepare('SELECT email FROM account WHERE id = (SELECT account_id FROM token WHERE account_token = ?)'); // Requête SQL pour obtenir l'email

                sql.get([jeton], (err, row) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        return reject(new Error("Erreur lors de l'exécution de la requête : " + err.message));
                    }

                    if (!row) { // Si aucun jeton n'est trouvé
                        return reject(new Error("Jeton inconnu"));
                    }

                    sql.finalize((err) => { // Finalisation de la requête SQL
                        if (err) { // Gestion des erreurs de finalisation
                            return reject(new Error("Erreur lors de la finalisation de la requête : " + err.message));
                        }
                        console.log(row);
                        if (row.email !== email) { // Vérification de la correspondance des emails
                            return reject(new Error("L'email ne correspond pas à celui du compte"));
                        }
                        resolve(row.email); // Résolution de la promesse avec l'email
                    });
                });
            } catch (error) { // Gestion des erreurs de vérification du token
                reject(new Error("Échec de la vérification du token : " + error.message));
            }
        });
    }
}

module.exports = Jwt; // Exportation de l'objet Jwt pour utilisation externe