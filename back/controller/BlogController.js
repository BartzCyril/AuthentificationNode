const jwt = require('jsonwebtoken'); // Importation de jsonwebtoken pour la gestion des tokens JWT

class BlogController {
    app = null; // Initialisation de la variable app à null
    Account = null; // Initialisation de la variable Account à null
    Blog = null; // Initialisation de la variable Blog à null

    constructor(app, Account, Blog) { // Constructeur qui prend l'application, Account et Blog en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.Account = Account; // Assignation de Account à l'instance
        this.Blog = Blog; // Assignation de Blog à l'instance
        this.getBlogs(); // Appel de la méthode getBlogs pour définir la route de récupération des blogs
        this.createBlog(); // Appel de la méthode createBlog pour définir la route de création de blog
        this.getBlog(); // Appel de la méthode getBlog pour définir la route de récupération d'un blog
        this.updateBlog(); // Appel de la méthode updateBlog pour définir la route de mise à jour d'un blog
        this.deleteBlog(); // Appel de la méthode deleteBlog pour définir la route de suppression d'un blog
        this.adminBlog(); // Appel de la méthode adminBlog pour définir la route d'administration des blogs
    }

    getBlogs() { // Méthode pour définir la route de récupération des blogs
        this.app.post('/blogs', async (req, res) => {
            const { isConnected } = req.body; // Récupération de l'état de connexion depuis le corps de la requête

            const getBlogs = await this.Blog.getBlogs(isConnected); // Obtention des blogs

            if (getBlogs.status !== 200) { // Si l'obtention échoue
                res.status(getBlogs.status).send({
                    status: "Erreur",
                    message: getBlogs.message
                });
            } else { // Si l'obtention réussit
                res.status(200).send({
                    status: "Succès",
                    message: getBlogs.message
                });
            }
        });
    }

    createBlog() { // Méthode pour définir la route de création de blog
        this.app.post('/blog', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            if (!jeton.otp) { // Si la double authentification n'est pas activée
                res.status(400).send({
                    status: "Erreur",
                    message: "Vous devez avoir activé la double authentification pour créer votre blog"
                });
                return;
            }

            const email = jeton.email; // Extraction de l'email depuis le token

            const { title, status } = req.body; // Récupération du titre et du statut depuis le corps de la requête

            const setBlog = await this.Blog.setBlog(email, title, status); // Création du blog

            if (setBlog.status !== 200) { // Si la création échoue
                res.status(setBlog.status).send({
                    status: "Erreur",
                    message: setBlog.message
                });
            } else { // Si la création réussit
                res.status(200).send({
                    status: "Succès",
                    message: { title, status, id: setBlog.message }
                });
            }
        });
    }

    getBlog() { // Méthode pour définir la route de récupération d'un blog
        this.app.get('/blog', async (req, res) => {
            const id = req.query.id; // Récupération de l'ID du blog depuis les paramètres de la requête

            if (!id) { // Si aucun ID n'est fourni
                res.status(400).send({
                    status: "Erreur",
                    message: "Aucun id de blog fourni"
                });
                return;
            }

            const token = req.headers.token; // Récupération du token depuis les headers

            let getBlog = null;

            if (!token) { // Si aucun token n'est fourni
                getBlog = await this.Blog.getBlog(null, id);
            } else {
                const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token
                const email = jeton.email; // Extraction de l'email depuis le token
                getBlog = await this.Blog.getBlog(email, id);
            }

            if (getBlog.status !== 200) { // Si l'obtention échoue
                res.status(getBlog.status).send({
                    status: "Erreur",
                    message: getBlog.message
                });
            } else { // Si l'obtention réussit
                res.status(200).send({
                    status: "Succès",
                    message: getBlog.message
                });
            }
        });
    }

    updateBlog() { // Méthode pour définir la route de mise à jour d'un blog
        this.app.patch('/blog', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            if (!jeton.otp) { // Si la double authentification n'est pas activée
                res.status(400).send({
                    status: "Erreur",
                    message: "Vous devez avoir activé la double authentification pour gérer votre blog"
                });
                return;
            }

            const email = jeton.email; // Extraction de l'email depuis le token

            const { title, status } = req.body; // Récupération du titre et du statut depuis le corps de la requête

            if (!title && !status) { // Si ni le titre ni le statut ne sont fournis
                res.status(200).send({
                    status: "Succès",
                    message: 'Aucune modification'
                });
                return;
            }

            const updateBlog = await this.Blog.updateBlog(email, title, status); // Mise à jour du blog

            if (updateBlog.status !== 200) { // Si la mise à jour échoue
                res.status(updateBlog.status).send({
                    status: "Erreur",
                    message: updateBlog.message
                });
            } else { // Si la mise à jour réussit
                res.status(200).send({
                    status: "Succès",
                    message: updateBlog.message
                });
            }
        });
    }

    deleteBlog() { // Méthode pour définir la route de suppression d'un blog
        this.app.delete('/blog', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            if (!jeton.otp) { // Si la double authentification n'est pas activée
                res.status(400).send({
                    status: "Erreur",
                    message: "Vous devez avoir activé la double authentification pour gérer votre blog"
                });
                return;
            }

            const email = jeton.email; // Extraction de l'email depuis le token

            const { blog_id } = req.body; // Récupération de l'ID du blog depuis le corps de la requête

            const deleteBlog = await this.Blog.deleteBlog(email, blog_id); // Suppression du blog

            if (deleteBlog.status !== 200) { // Si la suppression échoue
                res.status(deleteBlog.status).send({
                    status: "Erreur",
                    message: deleteBlog.message
                });
            } else { // Si la suppression réussit
                res.status(200).send({
                    status: "Succès",
                    message: deleteBlog.message
                });
            }
        });
    }

    adminBlog() { // Méthode pour définir la route d'administration des blogs
        this.app.get('/admin/blog', async (req, res) => {
            const token = req.headers.token; // Récupération du token depuis les headers

            const jeton = jwt.verify(token, process.env.SECRET_KEY); // Vérification du token

            const email = jeton.email; // Extraction de l'email depuis le token

            const getAdminBlog = await this.Blog.getAdminBlog(email); // Obtention des blogs administrés

            if (getAdminBlog.status !== 200) { // Si l'obtention échoue
                res.status(getAdminBlog.status).send({
                    status: "Erreur",
                    message: getAdminBlog.message
                });
            } else { // Si l'obtention réussit
                res.status(200).send({
                    status: "Succès",
                    message: getAdminBlog.message,
                    otp: jeton.otp
                });
            }
        });
    }
}

module.exports = BlogController; // Exportation de la classe BlogController pour utilisation externe
