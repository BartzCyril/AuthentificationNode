const sqlite3 = require('sqlite3').verbose(); // Importation de sqlite3 pour obtenir plus de détails lors des opérations sur la base de données

class Db {
    db = null; // Initialisation de la variable db à null

    constructor() { // Constructeur pour initialiser la connexion à la base de données
        this.db = new sqlite3.Database('data.db', (err) => { // Connexion à la base de données 'data.db'
            if (err) { // Gestion des erreurs lors de la connexion
                console.error('Erreur lors de la connexion à la base de données:', err.message); // Affichage d'un message d'erreur en cas de problème de connexion
            }
        });
        this.db.run("PRAGMA foreign_keys=ON")
    }
}

module.exports = Db; // Exportation de la classe Db pour utilisation externe
