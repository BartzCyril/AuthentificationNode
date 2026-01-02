const bcrypt = require('bcrypt'); // Importation de bcrypt pour le hachage des mots de passe
const { reject } = require("bcrypt/promises"); // Importation de reject de bcrypt/promises

class Account {
    db = null; // Initialisation de la variable db à null

    constructor(db) { // Constructeur qui prend une base de données en paramètre
        this.db = db; // Assignation de la base de données à l'instance
        this.createTable(); // Création de la table account si elle n'existe pas
    }

    createTable() { // Méthode pour créer la table account
        this.db.run(`CREATE TABLE IF NOT EXISTS account
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255),
            mfaSecret VARCHAR(255)
        )`, (err) => { // Exécution de la commande SQL pour créer la table
            if (err) { // Gestion des erreurs
                console.error('Erreur lors de la création de la table:', err.message); // Affichage d'un message d'erreur
            }
        });
    }

    insertEmail(email) { // Méthode pour insérer un email
        console.log(email);
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'INSERT INTO account (email) VALUES (?)'; // Requête SQL pour insérer un email
            this.db.run(sql, [email], function (err) { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de l\'enregistrement du compte. Veuillez réessayer.'
                    });
                } else { // Si l'insertion est réussie
                    return resolve({
                        status: 200,
                        message: this.lastID // Renvoie l'ID du dernier enregistrement inséré
                    });
                }
            });
        });
    }

    insertEmailAndPassword(email, password) { // Méthode pour insérer un email et un mot de passe
        return new Promise((resolve, reject) => { // Renvoie une promesse
            bcrypt.hash(password, 10, (err, hash) => { // Hachage du mot de passe
                if (err) { // Gestion des erreurs de hachage
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors du hachage. Veuillez contacter l\'administrateur.'
                    });
                }

                // Insertion des données dans la table
                const sql = 'INSERT INTO account (email, password) VALUES (?, ?)'; // Requête SQL pour insérer un email et un mot de passe
                this.db.run(sql, [email, hash], function (err) { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue lors de l\'enregistrement du compte. Veuillez réessayer.'
                        });
                    } else { // Si l'insertion est réussie
                        return resolve({
                            status: 200,
                            message: 'Le compte a bien été enregistré.'
                        });
                    }
                });
            });
        });
    }

    getPasswordAndMfaSecret(email) { // Méthode pour obtenir le mot de passe et le secret MFA
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = this.db.prepare(`SELECT password, mfaSecret FROM account WHERE email = ?`, [email]); // Requête SQL pour obtenir le mot de passe et le secret MFA
            sql.get((err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la récupération du mot de passe et du secret MFA. Veuillez réessayer.'
                    });
                }

                if (!row) { // Si aucun compte n'est trouvé
                    return resolve({
                        status: 404,
                        message: 'Compte introuvable.'
                    });
                }

                return resolve({ // Résolution de la promesse avec le mot de passe et le secret MFA
                    status: 200,
                    message: row
                });
            });
        });
    }

    getId(email) { // Méthode pour obtenir l'identifiant d'un compte
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'SELECT id FROM account WHERE email = ?'; // Requête SQL pour obtenir l'identifiant
            this.db.get(sql, [email], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la récupération de l\'identifiant. Veuillez réessayer.'
                    });
                }

                if (!row) { // Si aucun identifiant n'est trouvé
                    return resolve({
                        status: 404,
                        message: 'Identifiant introuvable.'
                    });
                }

                return resolve({ // Résolution de la promesse avec l'identifiant
                    status: 200,
                    message: row.id
                });
            });
        });
    }

    updatePassword(id, password) { // Méthode pour mettre à jour le mot de passe
        return new Promise((resolve, reject) => { // Renvoie une promesse
            bcrypt.hash(password, 10, (err, hash) => { // Hachage du nouveau mot de passe
                if (err) { // Gestion des erreurs de hachage
                    resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors du hachage. Veuillez contacter l\'administrateur.'
                    });
                    return;
                }
                const sql = this.db.prepare("UPDATE account SET password = ? WHERE email = ?", [hash, id]); // Requête SQL pour mettre à jour le mot de passe
                sql.run((err) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        resolve({
                            status: 500,
                            message: 'Une erreur est survenue lors de la modification du mot de passe. Veuillez réessayer.'
                        });
                        return;
                    }
                    sql.finalize();
                    resolve({
                        status: 200,
                        message: 'Le mot de passe a bien été modifié.'
                    });
                });
            });
        });
    }

    updateEmail(id, email) { // Méthode pour mettre à jour l'email
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = this.db.prepare("UPDATE account SET email = ? WHERE email = ?", [email, id]); // Requête SQL pour mettre à jour l'email
            sql.run((err) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la modification de l\'email. Veuillez réessayer.'
                    });
                    return;
                }
                sql.finalize();
                resolve({
                    status: 200,
                    message: 'L\'email a bien été modifié.'
                });
            });
        });
    }

    updateMfaSecret(email, mfaSecret) { // Méthode pour mettre à jour le secret MFA
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'UPDATE account SET mfaSecret = ? WHERE email = ?'; // Requête SQL pour mettre à jour le secret MFA
            this.db.run(sql, [mfaSecret, email], function (err) { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la mise à jour du secret MFA. Veuillez réessayer.'
                    });
                } else { // Si la mise à jour est réussie
                    return resolve({
                        status: 200,
                        message: 'Le secret MFA a bien été enregistré.'
                    });
                }
            });
        });
    }

    getMfaSecret(email) { // Méthode pour obtenir le secret MFA
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'SELECT mfaSecret FROM account WHERE email = ?'; // Requête SQL pour obtenir le secret MFA
            this.db.get(sql, [email], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la récupération du secret MFA. Veuillez réessayer.'
                    });
                }

                if (!row) { // Si aucun secret MFA n'est trouvé
                    return resolve({
                        status: 404,
                        message: 'Secret MFA introuvable.'
                    });
                }

                return resolve({ // Résolution de la promesse avec le secret MFA
                    status: 200,
                    message: row ? row.mfaSecret : 'Secret MFA non trouvé'
                });
            });
        });
    }

    deleteMfaSecret(email) { // Méthode pour supprimer le secret MFA
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'UPDATE account SET mfaSecret = NULL WHERE email = ?'; // Requête SQL pour supprimer le secret MFA
            this.db.run(sql, [email], function (err) { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la suppression du secret MFA. Veuillez réessayer.'
                    });
                } else { // Si la suppression est réussie
                    return resolve({
                        status: 200,
                        message: 'La double authentification a été désactivée avec succès.'
                    });
                }
            });
        });
    }
}

module.exports = Account; // Exportation de la classe Account pour utilisation externe