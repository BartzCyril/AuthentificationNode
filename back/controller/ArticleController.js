const jwt = require('jsonwebtoken'); // Importation de jsonwebtoken pour la gestion des tokens JWT

class ArticleController {
    app = null; // Initialisation de la variable app à null
    Account = null; // Initialisation de la variable Account à null
    Blog = null; // Initialisation de la variable Blog à null
    Article = null; // Initialisation de la variable Article à null

    constructor(app, Account, Blog, Article) { // Constructeur qui prend l'application, Account, Blog et Article en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.Account = Account; // Assignation de Account à l'instance
        this.Blog = Blog; // Assignation de Blog à l'instance
        this.Article = Article; // Assignation de Article à l'instance
        this.getArticles(); // Appel de la méthode getArticles pour définir la route de récupération des articles
        this.createArticle(); // Appel de la méthode createArticle pour définir la route de création d'article
        this.getArticle(); // Appel de la méthode getArticle pour définir la route de récupération d'un article
        this.updateArticle(); // Appel de la méthode updateArticle pour définir la route de mise à jour d'article
        this.deleteArticle(); // Appel de la méthode deleteArticle pour définir la route de suppression d'article
    }
    
    getArticles() { // Méthode pour définir la route de récupération des articles
        this.app.get('/articles', async (req, res) => {
            const { blog_id } = req.query; // Récupération de l'ID du blog depuis les paramètres de la requête

            const getArticles = await this.Article.getArticles(blog_id); // Obtention des articles du blog

            if (getArticles.status !== 200) { // Si l'obtention échoue
                res.status(getArticles.status).send({
                    status: "Erreur",
                    message: getArticles.message
                });
            } else { // Si l'obtention réussit
                res.status(200).send({
                    status: "Succès",
                    message: getArticles.message
                });
            }
        });
    }

    createArticle() { // Méthode pour définir la route de création d'article
        this.app.post('/article', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const { title, content } = req.body; // Récupération du titre et du contenu depuis le corps de la requête

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            if (!jeton.otp) { // Si la double authentification n'est pas activée
                res.status(400).send({
                    status: "Erreur",
                    message: "Vous devez avoir activé la double authentification pour gérer des articles."
                });
                return;
            }

            const email = jeton.email; // Extraction de l'email depuis le token

            const addArticle = await this.Article.setArticle(email, title, content); // Création de l'article

            if (addArticle.status !== 200) { // Si la création échoue
                res.status(addArticle.status).send({
                    status: "Erreur",
                    message: addArticle.message
                });
            } else { // Si la création réussit
                res.status(200).send({
                    status: "Succès",
                    message: addArticle.message,
                    id: addArticle.id
                });
            }
        });
    }

    getArticle() { // Méthode pour définir la route de récupération d'un article
        this.app.get('/article', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const { article_id } = req.query; // Récupération de l'ID de l'article depuis les paramètres de la requête

            const getArticle = await this.Article.getArticle(article_id); // Obtention de l'article

            if (getArticle.status !== 200) { // Si l'obtention échoue
                res.status(getArticle.status).send({
                    status: "Erreur",
                    message: getArticle.message
                });
            } else {
                if (!token && getArticle.message.status == 'privé') { // Si l'article est privé et que l'utilisateur n'est pas connecté
                    res.status(400).send({
                        status: "Erreur",
                        message: 'Vous devez être connecté(e) pour consulter l\'article d\'un blog privé.'
                    });
                    return;
                }
                res.status(200).send({
                    status: "Succès",
                    message: getArticle.message
                });
            }
        });
    }

    updateArticle() { // Méthode pour définir la route de mise à jour d'article
        this.app.patch('/article', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const { article_id, title, content } = req.body; // Récupération de l'ID de l'article, du titre et du contenu depuis le corps de la requête

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            if (!jeton.otp) { // Si la double authentification n'est pas activée
                res.status(400).send({
                    status: "Erreur",
                    message: "Vous devez avoir activé la double authentification pour gérer des articles."
                });
                return;
            }

            if (!title && !content) { // Si ni le titre ni le contenu ne sont fournis
                res.status(200).send({
                    status: "Succès",
                    message: 'Aucune modification'
                });
                return;
            }

            const email = jeton.email; // Extraction de l'email depuis le token

            const addArticle = await this.Article.updateArticle(email, article_id, title, content); // Mise à jour de l'article

            if (addArticle.status !== 200) { // Si la mise à jour échoue
                res.status(addArticle.status).send({
                    status: "Erreur",
                    message: addArticle.message
                });
            } else { // Si la mise à jour réussit
                res.status(200).send({
                    status: "Succès",
                    message: addArticle.message
                });
            }
        });
    }

    deleteArticle() { // Méthode pour définir la route de suppression d'article
        this.app.delete('/article', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const { article_id } = req.body; // Récupération de l'ID de l'article depuis le corps de la requête

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            if (!jeton.otp) { // Si la double authentification n'est pas activée
                res.status(400).send({
                    status: "Erreur",
                    message: "Vous devez avoir activé la double authentification pour gérer des articles."
                });
                return;
            }

            const email = jeton.email; // Extraction de l'email depuis le token

            const deleteArticle = await this.Article.deleteArticle(email, article_id); // Suppression de l'article

            if (deleteArticle.status !== 200) { // Si la suppression échoue
                res.status(deleteArticle.status).send({
                    status: "Erreur",
                    message: deleteArticle.message
                });
            } else { // Si la suppression réussit
                res.status(200).send({
                    status: "Succès",
                    message: deleteArticle.message
                });
            }
        });
    }
}

module.exports = ArticleController; // Exportation de la classe ArticleController pour utilisation externe
