class Token {
    db = null; // Initialisation de la variable db à null
    constructor(db) { // Constructeur qui prend une base de données en paramètre
        this.db = db; // Assignation de la base de données à l'instance
        this.createTable(); // Création de la table token si elle n'existe pas
    }

    createTable() { // Méthode pour créer la table token
        this.db.run(`CREATE TABLE IF NOT EXISTS token
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER,
            account_token VARCHAR(255) NOT NULL,
            FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
        )`, (err) => { // Exécution de la commande SQL pour créer la table
            if (err) { // Gestion des erreurs
                console.error('Erreur lors de la création de la table:', err.message);
            }
        });
    }

    getEmail(account_token) { // Méthode pour obtenir l'email à partir du token
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'SELECT email FROM account WHERE id = (SELECT account_id FROM token WHERE account_token = ?)'; // Requête SQL pour obtenir l'email
            this.db.get(sql, [account_token], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la récupération du token. Veuillez réessayer.'
                    });
                }
                if (!row) { // Si aucune ligne n'est trouvée
                    return resolve({
                        status: 404,
                        message: 'Le token est introuvable.'
                    });
                }
                return resolve({ // Résolution de la promesse avec l'email
                    status: 200,
                    message: row.email
                });
            });
        });
    }

    getAccountId(account_token) { // Méthode pour obtenir l'identifiant du compte à partir du token
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'SELECT account_id FROM token WHERE account_token = ?'; // Requête SQL pour obtenir l'identifiant du compte
            this.db.get(sql, [account_token], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la récupération du token. Veuillez réessayer.'
                    });
                }
                if (!row) { // Si aucune ligne n'est trouvée
                    return resolve({
                        status: 404,
                        message: 'Le token est introuvable.'
                    });
                }
                return resolve({ // Résolution de la promesse avec l'identifiant du compte
                    status: 200,
                    message: row.account_id
                });
            });
        });
    }

    insertToken(account_id, account_token) { // Méthode pour insérer un nouveau token
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'INSERT INTO token (account_id, account_token) VALUES (?, ?)'; // Requête SQL pour insérer un nouveau token
            this.db.run(sql, [account_id, account_token], function (err) { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de l\'enregistrement du token. Veuillez réessayer.'
                    });
                } else { // Si l'insertion est réussie
                    return resolve({
                        status: 200,
                        message: 'Le token a bien été enregistré.'
                    });
                }
            });
        });
    }

    deleteToken(account_token) { // Méthode pour supprimer un token
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'DELETE FROM token WHERE account_token = ?'; // Requête SQL pour supprimer un token
            this.db.run(sql, [account_token], function (err) { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la suppression du token. Veuillez réessayer.'
                    });
                } else { // Si la suppression est réussie
                    return resolve({
                        status: 200,
                        message: 'Le token a bien été supprimé.'
                    });
                }
            });
        });
    }

    deleteAllToken(account_id) { // Méthode pour supprimer tous les tokens d'un compte
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'DELETE FROM token WHERE account_id = ?'; // Requête SQL pour supprimer tous les tokens d'un compte
            this.db.run(sql, [account_id], function (err) { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la suppression du token. Veuillez réessayer.'
                    });
                } else { // Si la suppression est réussie
                    return resolve({
                        status: 200,
                        message: 'Le token a bien été supprimé.'
                    });
                }
            });
        });
    }
}

module.exports = Token; // Exportation de la classe Token pour utilisation externe