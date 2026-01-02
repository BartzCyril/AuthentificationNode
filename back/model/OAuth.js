class OAuth {
    db = null; // Initialisation de la variable db à null

    constructor(db) { // Constructeur qui prend une base de données en paramètre
        this.db = db; // Assignation de la base de données à l'instance
        this.createTable(); // Création de la table oauth si elle n'existe pas
    }

    createTable() { // Méthode pour créer la table oauth
        this.db.run(`CREATE TABLE IF NOT EXISTS oauth
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            provider_id INTEGER NOT NULL,
            provider_name VARCHAR(50) NOT NULL,
            FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE CASCADE
            )`, (err) => { // Exécution de la commande SQL pour créer la table
            if (err) { // Gestion des erreurs
                console.error('Erreur lors de la création de la table:', err.message);
            }
        });
    }

    insert(account_id, provider_id, provider_name) { // Méthode pour insérer un nouveau compte OAuth
        return new Promise((resolve, reject) => { // Renvoie une promesse
            const sql = 'INSERT INTO oauth (account_id, provider_id, provider_name) VALUES (?, ?, ?)'; // Requête SQL pour insérer un nouveau compte OAuth
            this.db.run(sql, [account_id, provider_id, provider_name], function (err) { // Exécution de la requête SQL
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

    getOAuth(provider_id, id) { // Méthode pour obtenir un compte OAuth
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = null; // Initialisation de la variable SQL
            if (!id) { // Si l'ID n'est pas fourni
                sql = this.db.prepare(`SELECT * FROM oauth WHERE provider_id = ?`, [provider_id]); // Requête SQL pour obtenir les comptes OAuth par provider_id
            } else { // Si l'ID est fourni
                sql = this.db.prepare(`SELECT * FROM oauth WHERE id = ?`, [id]); // Requête SQL pour obtenir le compte OAuth par ID
            }
            sql.get((err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la récupération du compte. Veuillez réessayer.'
                    });
                }
                return resolve({ // Résolution de la promesse avec le compte OAuth
                    status: 200,
                    message: row
                });
            });
        });
    }

}

module.exports = OAuth; // Exportation de la classe OAuth pour utilisation externe