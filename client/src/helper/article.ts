import api from "./api.ts";
import {toast} from "react-toastify";
import {verify} from "./customer.ts";
import {NavigateFunction} from "react-router-dom";
import {Article} from "../types.ts";

/**
 * Fonctions utilitaires pour la gestion des articles.
 */
const article = {
    /**
     * Supprime un article.
     * @param {number} id - L'ID de l'article à supprimer.
     * @param {Array<Article>} articles - La liste actuelle des articles.
     * @param {function} setArticles - Fonction pour mettre à jour la liste des articles.
     * @param {function} logout - Fonction pour déconnecter l'utilisateur.
     * @param {NavigateFunction} navigate - Fonction pour naviguer vers une autre route.
     */
    deleteArticle(id: number, articles: Array<Article>, setArticles: (value: (((prevState: Article[]) => Article[]) | Article[])) => void, logout: () => void, navigate: NavigateFunction) {
        verify()
            .then(() => {
                api("DELETE", `article`, {
                    article_id: id
                })
                    .then((response) => {
                        setArticles(articles.filter(article => article.id !== id));
                        toast.success(response.message, {
                            position: "bottom-center"
                        });
                    })
                    .catch((response) => {
                        toast.error(response.message, {
                            position: "bottom-center"
                        });
                    });
            })
            .catch(() => {
                logout();
                navigate("/");
            });
    },

    /**
     * Récupère tous les articles pour un blog spécifique.
     * @param {function} setArticles - Fonction pour mettre à jour la liste des articles.
     * @param {number} id - L'ID du blog.
     * @param {function} setLoading - Fonction pour définir l'état de chargement.
     */
    async getAllArticles(setArticles: (articles: Array<Article>) => void, id: number, setLoading: (loading: boolean) => void) {
        try {
            setLoading(true);
            const response = await api("GET", `articles?blog_id=${id}`);
            const articles = response.message;

            const fetchPromises = articles.map(async (article: Article) => {
                const imageResponse = await fetch(`http://localhost:3001/image?articleId=${article.id}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                const imageData = await imageResponse.json();
                if (imageData.status === "Erreur") {
                    toast.error(imageData.message, {
                        position: "bottom-center"
                    });
                    return null;
                } else {
                    const base64Image = imageData.image;
                    const mimeType = imageData.mimeType;
                    const imageUrl = `data:${mimeType};base64,${base64Image}`;
                    return {
                        id: article.id,
                        title: article.title,
                        content: article.content,
                        image: imageUrl
                    };
                }
            });

            const data = await Promise.all(fetchPromises);
            const validData = data.filter(article => article !== null);
            setArticles(validData);
        } catch (error) {
            toast.error(error.message, {
                position: "bottom-center"
            });
        } finally {
            setLoading(false);
        }
    },

    /**
     * Crée un nouvel article.
     * @param {number} id - L'ID du blog.
     * @param {string} title - Le titre de l'article.
     * @param {string} content - Le contenu de l'article.
     * @param {number} email - L'email du client
     * @param {function} setArticles - Fonction pour mettre à jour la liste des articles.
     * @param {Array<Article>} articles - La liste actuelle des articles.
     * @param {function} logout - Fonction pour déconnecter l'utilisateur.
     * @param {NavigateFunction} navigate - Fonction pour naviguer vers une autre route.
     */
    createArticle(id: number, title: string, content: string, email : string, setArticles: (articles: Array<Article>) => void, articles: Array<Article>, logout: () => void, navigate: NavigateFunction, file: File) {
        if (!file) {
            toast.error("Veuillez sélectionner une image", {
                position: "bottom-center"
            });
            return;
        }
        verify()
            .then(async () => {
                fetch('http://localhost:3000/accountId?email=' + encodeURI(email),{
                    method: 'GET',
                    headers: {
                        "Content-Type": "application/json"
                    }
                }).then((response) => response.json())
                    .then((response) => {
                        fetch('http://localhost:3002/oauth/token', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                            },
                            body: new URLSearchParams({
                                grant_type: 'client_credentials',
                                client_id: `${response.message}`,
                                client_secret: 'client-secret',
                            }),
                        }).then((response) => response.json())
                            .then((response) => {
                                const accessToken = response.accessToken;
                                api("POST", "article", {
                                    title: title,
                                    content: content,
                                    id: id
                                })
                                    .then((responseArticle) => {
                                        // L'article a bien été créé
                                        const formData = new FormData();
                                        formData.append("files", file);
                                        formData.append("articleId", responseArticle.id); // Ajoutez les autres champs ici
                                        formData.append("token", accessToken);
                                        fetch("http://localhost:3001/upload", {
                                            method: "POST",
                                            body: formData, // Le corps de la requête est le FormData
                                            headers: {
                                                Authorization: `Bearer ${accessToken}`,
                                            },
                                        })
                                            .then((response) => response.json())
                                            .then(() => {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setArticles([...articles, {
                                                        id: responseArticle.id,
                                                        title: title,
                                                        content: content,
                                                        image: reader.result as string
                                                    }]);
                                                    toast.success(responseArticle.message, {
                                                        position: "bottom-center"
                                                    });
                                                };
                                                reader.readAsDataURL(file);
                                            })
                                            .catch((response) => toast.error(response.message, {
                                                position: "bottom-center"
                                            }));
                                    })
                                    .catch((response) => {
                                        toast.error(response.message, {
                                            position: "bottom-center"
                                        });
                                    });
                            }).catch((response) => {
                            toast.error(response.message, {
                                position: "bottom-center"
                            });
                        });
                    })
                    .catch((response) => {
                    toast.error(response.message, {
                        position: "bottom-center"
                    });
                })
            })
            .catch(() => {
                logout();
                navigate("/");
            });
    },

    /**
     * Met à jour un article existant.
     * @param {string} title - Le nouveau titre de l'article.
     * @param {string} content - Le nouveau contenu de l'article.
     * @param {function} setArticles - Fonction pour mettre à jour la liste des articles.
     * @param {Array<Article>} articles - La liste actuelle des articles.
     * @param {number} id - L'ID de l'article à mettre à jour.
     * @param {function} setUpdateArticle - Fonction pour définir l'état de mise à jour de l'article.
     * @param {function} logout - Fonction pour déconnecter l'utilisateur.
     * @param {NavigateFunction} navigate - Fonction pour naviguer vers une autre route.
     */
    updateArticle(title: string, content: string, setArticles: (articles: Array<Article>) => void, articles: Array<Article>, id: number, setUpdateArticle: (updateArticle: boolean) => void, logout: () => void, navigate: NavigateFunction) {
        verify()
            .then(() => {
                api("PATCH", `article`, {
                    title: title,
                    content: content,
                    article_id: id
                })
                    .then((response) => {
                        // L'article a bien été modifié
                        setArticles(articles.map((article) => {
                            if (article.id === id) {
                                return {
                                    id: article.id,
                                    title: title,
                                    content: content,
                                    image: article.image
                                };
                            }
                            return article;
                        }));
                        setUpdateArticle(false);
                        toast.success(response.message, {
                            position: "bottom-center"
                        });
                    })
                    .catch(() => {
                    });
            }).catch(() => {
            logout();
            navigate("/");
        });
    }
};

export default article;