class Article {
    db = null; // Initialisation de la variable db à null

    constructor(db) { // Constructeur qui prend une base de données en paramètre
        this.db = db; // Assignation de la base de données à l'instance
        this.createTable(); // Création de la table article si elle n'existe pas
    }

    createTable() { // Méthode pour créer la table article
        this.db.run(`
        CREATE TABLE IF NOT EXISTS article
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            blog_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            CONSTRAINT fk_art_blog_id
                FOREIGN KEY (blog_id)
                REFERENCES blog(id)
                ON DELETE CASCADE
        );`, (err) => { // Exécution de la commande SQL pour créer la table
            if (err) { // Gestion des erreurs
                console.error('Erreur lors de la création de la table:', err.message); // Affichage d'un message d'erreur
            }
        });
    }

    getArticles(blog_id) { // Méthode pour obtenir les articles d'un blog
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = this.db.prepare('SELECT * FROM article WHERE blog_id = ?', [blog_id]); // Requête SQL pour obtenir les articles
            sql.all((err, rows) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération des articles d\'un blog');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                return resolve({ // Résolution de la promesse avec les articles
                    status: 200,
                    message: rows
                });
            });
        });
    }

    async setArticle(email, title, content) { // Méthode pour ajouter un nouvel article
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = this.db.prepare('SELECT b.id FROM blog b\
                       INNER JOIN account a ON b.account_id = a.id\
                       WHERE a.email = ?', [email]); // Requête SQL pour vérifier si l'utilisateur possède un blog
            sql.get(async (err, result) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la vérification de l\'existance d\'un blog');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                let blog_id = "";
                if (!result) { // Si l'utilisateur ne possède pas de blog, en créer un
                    let get_blog_id = new Promise((resolution, rejet) => {
                        let sql = this.db.prepare('INSERT INTO blog(account_id, title, statut) VALUES((SELECT id from account WHERE email = ?), "Je suis le blog de ?", "public")', [email, email]); // Requête SQL pour créer un nouveau blog
                        sql.run(function (err) {
                            if (err) { // Gestion des erreurs
                                console.log('Une erreur est survenue lors de la création du blog');
                                resolution({
                                    status: 500,
                                    message: 'Une erreur est survenue lors de la modification du mot de passe. Veuillez réessayer.'
                                });
                                return;
                            }
                            resolution(this.lastID); // Renvoie l'ID du dernier enregistrement inséré
                        });
                    });
                    blog_id = await get_blog_id; // Attendre la création du blog et obtenir son ID
                } else {
                    blog_id = result.id; // Utiliser l'ID du blog existant
                }
                sql = this.db.prepare('INSERT INTO article(blog_id, title, content) VALUES(?, ?, ?)', [blog_id, title ? title : 'Je suis un article', content ? content : 'Je suis le contenu de l\'article']); // Requête SQL pour insérer un nouvel article
                sql.run(function (err) { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Une erreur est survenue lors de la création de l\'article.');
                        resolve({
                            status: 500,
                            message: 'Une erreur est survenue lors de la création de l\'article. Veuillez réessayer.'
                        });
                        return;
                    }
                    return resolve({ // Résolution de la promesse avec un message de succès et l'ID de l'article
                        status: 200,
                        message: 'Article ajouté',
                        id: this.lastID
                    });
                });
            });
        });
    }

    getArticle(article_id) { // Méthode pour obtenir un article par son ID
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = this.db.prepare('SELECT a.*, b.status as status FROM article a\
                                       INNER JOIN blog b ON a.blog_id = b.id\
                                       WHERE a.id = ?', [article_id]); // Requête SQL pour obtenir l'article et son statut
            sql.get((err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération de l\'article.');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                return resolve({ // Résolution de la promesse avec l'article
                    status: 200,
                    message: row
                });
            });
        });
    }

    updateArticle(email, article_id, title, content) { // Méthode pour mettre à jour un article
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = this.db.prepare('SELECT a.*, acc.email as email from article a\
                                   INNER JOIN blog b ON a.blog_id = b.id\
                                   INNER JOIN account acc ON b.account_id = acc.id\
                                   WHERE a.id = ?', [article_id]); // Requête SQL pour vérifier si l'article appartient à l'utilisateur
            sql.get((err, row) => {
                if (err) { // Gestion des erreurs
                    console.log('Une erreur est survenue lors de la récupération de l\'article.');
                    resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la modification de l\'article. Veuillez réessayer.'
                    });
                    return;
                }
                if (!row) { // Si l'article n'existe pas
                    return resolve({
                        status: 500,
                        message: 'Cet article n\'existe pas.'
                    });
                }
                if (row.email != email) { // Si l'utilisateur n'est pas le propriétaire de l'article
                    return resolve({
                        status: 500,
                        message: 'Vous ne pouvez pas modifier un article qui ne vous appartient pas.'
                    });
                }
                sql = 'UPDATE article set';
                let array_args = [];
                if (title) { // Mise à jour du titre
                    sql = sql + ' title = ?';
                    array_args.push(title);
                    if (content) { // Mise à jour du contenu
                        sql = sql + ', content = ?';
                        array_args.push(content);
                    }
                } else { // Mise à jour uniquement du contenu
                    sql = sql + ' content = ?';
                    array_args.push(content);
                }

                sql = sql + ' where id = ?';
                array_args.push(article_id);
                this.db.run(sql, array_args, (err) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Une erreur est survenue lors de la modification de l\'article.');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue lors de la modification de l\'article. Veuillez réessayer.'
                        });
                    }
                    return resolve({ // Résolution de la promesse avec un message de succès
                        status: 200,
                        message: 'Article modifié'
                    });
                });
            });
        });
    }

    deleteArticle(email, article_id) { // Méthode pour supprimer un article
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = this.db.prepare('SELECT a.*, acc.email as email from article a\
                                   INNER JOIN blog b ON a.blog_id = b.id\
                                   INNER JOIN account acc ON b.account_id = acc.id\
                                   WHERE a.id = ?', [article_id]); // Requête SQL pour vérifier si l'article appartient à l'utilisateur
            sql.get((err, row) => {
                if (err) { // Gestion des erreurs
                    console.log('Une erreur est survenue lors de la récupération de l\'article.');
                    resolve({
                        status: 500,
                        message: 'Une erreur est survenue lors de la modification de l\'article. Veuillez réessayer.'
                    });
                    return;
                }
                if (!row) { // Si l'article n'existe pas
                    return resolve({
                        status: 500,
                        message: 'Cet article n\'existe pas.'
                    });
                }
                if (row.email != email) { // Si l'utilisateur n'est pas le propriétaire de l'article
                    return resolve({
                        status: 500,
                        message: 'Vous ne pouvez pas supprimer un article qui ne vous appartient pas.'
                    });
                }
                sql = 'DELETE FROM article WHERE id = ?';
                this.db.run(sql, [article_id], (err) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Une erreur est survenue lors de la suppression de l\'article.');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue lors de la suppression de l\'article. Veuillez contacter un administrateur.'
                        });
                    }
                    return resolve({ // Résolution de la promesse avec un message de succès
                        status: 200,
                        message: 'Article supprimé'
                    });
                });
            });
        });
    }
}

module.exports = Article; // Exportation de la classe Article pour utilisation externe
