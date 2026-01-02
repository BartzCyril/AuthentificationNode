class Blog {
    db = null; // Initialisation de la variable db à null

    constructor(db) { // Constructeur qui prend une base de données en paramètre
        this.db = db; // Assignation de la base de données à l'instance
        this.createTable(); // Création de la table blog si elle n'existe pas
    }

    createTable() { // Méthode pour créer la table blog
        this.db.run(`CREATE TABLE IF NOT EXISTS blog
        (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            title VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL,
            FOREIGN KEY (account_id) REFERENCES account(id)
        );`, (err) => { // Exécution de la commande SQL pour créer la table
            if (err) { // Gestion des erreurs
                console.error('Erreur lors de la création de la table:', err.message); // Affichage d'un message d'erreur
            }
        });
    }

    getBlogs(isLoggedIn) { // Méthode pour obtenir les blogs
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = 'SELECT id, title, status FROM blog'; // Requête SQL pour obtenir les blogs
            if (!isLoggedIn) {
                sql += ' WHERE status = "public"'; // Filtrer les blogs publics si l'utilisateur n'est pas connecté
            }
            this.db.all(sql, (err, rows) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération des blogs');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                return resolve({ // Résolution de la promesse avec les blogs
                    status: 200,
                    message: rows
                });
            });
        });
    }

    getAdminBlog(email) { // Méthode pour obtenir les blogs administrés par un utilisateur
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = 'SELECT id FROM account WHERE email = ?'; // Requête SQL pour obtenir l'ID du compte

            this.db.get(sql, [email], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération du compte');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                if (!row) { // Si le compte n'est pas trouvé
                    console.log('Compte non trouvé pour ' + email);
                    return resolve({
                        status: 404,
                        message: 'Compte non trouvé'
                    });
                }

                const accountId = row.id; // Extraction de l'ID du compte

                sql = 'SELECT * FROM blog WHERE account_id = ?'; // Requête SQL pour obtenir les blogs administrés
                this.db.get(sql, [accountId], (err, row) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Erreur lors de la récupération du blog');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }

                    return resolve({ // Résolution de la promesse avec l'ID du blog
                        status: 200,
                        message: row ? row.id : null
                    });
                });
            });
        });
    }

    getBlog(email, blog_id) { // Méthode pour obtenir un blog par son ID
        return new Promise((resolve, reject) => { // Renvoie une promesse
            if (!email) { // Si l'utilisateur n'est pas connecté
                const sql = 'SELECT * FROM blog WHERE id = ?'; // Requête SQL pour obtenir le blog
                this.db.get(sql, [blog_id], (err, row) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Erreur lors de la récupération du blog');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }
                    if (!row) { // Si le blog n'est pas trouvé
                        console.log('Blog non trouvé pour l\'ID ' + blog_id);
                        return resolve({
                            status: 404,
                            message: 'Blog non trouvé'
                        });
                    }

                    if (row.status !== 'public') { // Si le blog est privé
                        return resolve({
                            status: 401,
                            message: 'Blog privé'
                        });
                    }

                    return resolve({ // Résolution de la promesse avec le blog
                        status: 200,
                        message: { admin: false, blog: row }
                    });
                });
            } else { // Si l'utilisateur est connecté
                let sql = 'SELECT id FROM account WHERE email = ?'; // Requête SQL pour obtenir l'ID du compte

                this.db.get(sql, [email], (err, row) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Erreur lors de la récupération du compte');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }
                    if (!row) { // Si le compte n'est pas trouvé
                        console.log('Compte non trouvé pour ' + email);
                        return resolve({
                            status: 404,
                            message: 'Compte non trouvé'
                        });
                    }

                    const accountId = row.id; // Extraction de l'ID du compte

                    sql = 'SELECT * FROM blog WHERE id = ?'; // Requête SQL pour obtenir le blog
                    this.db.get(sql, [blog_id], (err, row) => { // Exécution de la requête SQL
                        if (err) { // Gestion des erreurs
                            console.log('Erreur lors de la récupération du blog');
                            return resolve({
                                status: 500,
                                message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                            });
                        }
                        if (!row) { // Si le blog n'est pas trouvé
                            console.log('Blog non trouvé pour l\'ID ' + blog_id);
                            return resolve({
                                status: 404,
                                message: 'Blog non trouvé'
                            });
                        }

                        if (row.account_id === accountId) { // Si l'utilisateur est l'administrateur du blog
                            return resolve({
                                status: 200,
                                message: { admin: true, blog: row }
                            });
                        } else {
                            return resolve({ // Si l'utilisateur n'est pas l'administrateur du blog
                                status: 200,
                                message: { admin: false, blog: row }
                            });
                        }
                    });
                });
            }
        });
    }

    setBlog(email, title, status) { // Méthode pour créer un nouveau blog
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = 'SELECT id FROM account WHERE email = ?'; // Requête SQL pour obtenir l'ID du compte

            this.db.get(sql, [email], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération du compte');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                if (!row) { // Si le compte n'est pas trouvé
                    console.log('Compte non trouvé pour ' + email);
                    return resolve({
                        status: 404,
                        message: 'Compte non trouvé'
                    });
                }
                const accountId = row.id; // Extraction de l'ID du compte
                sql = 'SELECT id FROM blog WHERE account_id = ?'; // Requête SQL pour vérifier si l'utilisateur possède déjà un blog
                this.db.get(sql, [accountId], (err, row) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Erreur lors de la vérification du blog');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }
                    if (row) { // Si l'utilisateur possède déjà un blog
                        console.log('Un blog existe déjà pour ' + email);
                        return resolve({
                            status: 400,
                            message: 'Vous possédez déjà un blog'
                        });
                    }
                    sql = this.db.prepare('INSERT INTO blog(account_id, title, status) VALUES((SELECT id from account where email = ?), ?, ?)', [email, title, status]); // Requête SQL pour créer un nouveau blog
                    sql.run(function(err) { // Exécution de la requête SQL
                        if (err) { // Gestion des erreurs
                            console.log('Erreur lors de la création du blog');
                            return resolve({
                                status: 500,
                                message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                            });
                        }
                        console.log(this.lastID); // Affichage de l'ID du blog créé
                        return resolve({ // Résolution de la promesse avec l'ID du blog
                            status: 200,
                            message: this.lastID
                        });
                    });
                });
            });
        });
    }

    updateBlog(email, title, status) { // Méthode pour mettre à jour un blog
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = 'SELECT b.id FROM blog b \
                       INNER JOIN account acc ON b.account_id = acc.id'; // Requête SQL pour vérifier si l'utilisateur possède un blog

            this.db.get(sql, (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération du blog');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                if (!row) { // Si le blog n'existe pas
                    return resolve({
                        status: 500,
                        message: 'Vous ne pouvez pas modifier un blog qui n\'existe pas.'
                    });
                }
                sql = 'UPDATE blog set'; // Requête SQL pour mettre à jour le blog
                let array_args = [];
                if (title) { // Mise à jour du titre
                    sql = sql + ' title = ?';
                    array_args.push(title);
                    if (status) { // Mise à jour du statut
                        sql = sql + ', status = ?';
                        array_args.push(status);
                    }
                } else { // Mise à jour uniquement du statut
                    sql = sql + ' status = ?';
                    array_args.push(status);
                }

                sql = sql + ' where account_id = (SELECT id from account where email = ?)';
                array_args.push(email);
                this.db.run(sql, array_args, (err) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Erreur lors de la mise à jour du blog');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }
                    return resolve({ // Résolution de la promesse avec un message de succès
                        status: 200,
                        message: 'Blog modifié'
                    });
                });
            });
        });
    }

    deleteBlog(email, blog_id) { // Méthode pour supprimer un blog
        return new Promise((resolve, reject) => { // Renvoie une promesse
            let sql = 'SELECT b.*, a.email as email FROM blog b \
                       INNER JOIN account a ON b.account_id = a.id\
                       WHERE b.id = ?'; // Requête SQL pour vérifier si l'utilisateur possède le blog

            this.db.get(sql, [blog_id], (err, row) => { // Exécution de la requête SQL
                if (err) { // Gestion des erreurs
                    console.log('Erreur lors de la récupération du blog');
                    return resolve({
                        status: 500,
                        message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                    });
                }
                if (!row) { // Si le blog n'existe pas
                    return resolve({
                        status: 500,
                        message: 'Ce blog n\'existe pas.'
                    });
                }

                if (row.email != email) { // Si l'utilisateur n'est pas le propriétaire du blog
                    return resolve({
                        status: 500,
                        message: 'Vous ne pouvez pas supprimer un blog qui ne vous appartient pas.'
                    });
                }
                sql = 'DELETE FROM blog WHERE id = ?'; // Requête SQL pour supprimer le blog

                this.db.run(sql, [blog_id], (err) => { // Exécution de la requête SQL
                    if (err) { // Gestion des erreurs
                        console.log('Erreur lors de la suppression du blog');
                        return resolve({
                            status: 500,
                            message: 'Une erreur est survenue. Veuillez contacter l\'administrateur.'
                        });
                    }
                    return resolve({ // Résolution de la promesse avec un message de succès
                        status: 200,
                        message: 'Blog supprimé'
                    });
                });
            });
        });
    }
}

module.exports = Blog; // Exportation de la classe Blog pour utilisation externe
