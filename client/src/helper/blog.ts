import api from "./api.ts";
import { toast } from "react-toastify";
import { NavigateFunction } from "react-router-dom";
import { verify } from "./customer.ts";
import {Blog} from "../types.ts";
/**
 * Fonctions utilitaires pour la gestion des blogs.
 */
const blog = {
    /**
     * Supprime un blog.
     * @param {number} id - L'ID du blog à supprimer.
     * @param {function} setBlog - Fonction pour mettre à jour l'état du blog.
     * @param {function} logout - Fonction pour déconnecter l'utilisateur.
     * @param {NavigateFunction} navigate - Fonction pour naviguer vers une autre route.
     */
    deleteBlog(id: number, setBlog: (blog: Blog | null) => void, logout: () => void, navigate: NavigateFunction) {
        verify().then(() => {
            api("DELETE", `blog`, {
                blog_id: id
            })
                .then((response) => {
                    setBlog(null);
                    toast.success(response.message, {
                        position: "bottom-center"
                    });
                    navigate("/");
                })
                .catch((response) => {
                    toast.error(response.message, {
                        position: "bottom-center"
                    });
                });
        }).catch(() => {
            logout();
            navigate("/");
        });
    },

    /**
     * Récupère tous les blogs.
     * @param {function} setBlogs - Fonction pour mettre à jour la liste des blogs.
     * @param {function} setIsLoading - Fonction pour définir l'état de chargement.
     * @param {boolean} isConnected - Indique si l'utilisateur est connecté.
     */
    getBlogs(setBlogs: (blogs: Blog[]) => void, setIsLoading: (isLoading: boolean) => void, isConnected: boolean) {
        api("POST", `blogs`, {
            isConnected
        })
            .then((response) => {
                setBlogs(response.message);
            })
            .catch((response) => {
                toast.error(response.message, {
                    position: "bottom-center"
                });
            })
            .finally(() => setIsLoading(false));
    },

    /**
     * Récupère un blog spécifique.
     * @param {number} id - L'ID du blog à récupérer.
     * @param {function} setBlog - Fonction pour mettre à jour l'état du blog.
     * @param {function} setAdmin - Fonction pour définir l'état d'administrateur.
     */
    getBlog(id: number, setBlog: (blog: Blog) => void, setAdmin: (admin: boolean) => void) {
        api("GET", `blog?id=${id}`)
            .then((response) => {
                const blog = response.message.blog;
                setBlog({
                    id: blog.id,
                    title: blog.title,
                    status: blog.status,
                });
                setAdmin(response.message.admin);
            })
            .catch((response) => {
                toast.error(response.message, {
                    position: "bottom-center"
                });
            });
    },

    /**
     * Crée un nouveau blog.
     * @param {string} title - Le titre du blog.
     * @param {string} status - Le statut du blog (public ou privé).
     * @param {function} logout - Fonction pour déconnecter l'utilisateur.
     * @param {NavigateFunction} navigate - Fonction pour naviguer vers une autre route.
     * @returns {Promise<number>} - Retourne une promesse qui résout à l'ID du blog créé.
     */
    async createBlog(title: string, status: string, logout: () => void, navigate: NavigateFunction): Promise<number> {
        try {
            await verify();
            const response = await api("POST", `blog`, { title, status });
            return response.message.id;
        } catch (error) {
            toast.error(error.message, {
                position: "bottom-center"
            });
            logout();
            navigate("/");
            throw error;
        }
    },

    /**
     * Met à jour un blog existant.
     * @param {string} title - Le nouveau titre du blog.
     * @param {string} status - Le nouveau statut du blog (public ou privé).
     * @param {function} setBlog - Fonction pour mettre à jour l'état du blog.
     * @param {Blog} blog - L'objet blog actuel.
     * @param {function} setCreateBlog - Fonction pour définir l'état de création du blog.
     * @param {function} logout - Fonction pour déconnecter l'utilisateur.
     * @param {NavigateFunction} navigate - Fonction pour naviguer vers une autre route.
     */
    updateBlog(title: string, status: "public" | "private", setBlog: (blog: Blog | null) => void, blog: Blog, setCreateBlog: (createBlog: boolean) => void, logout: () => void, navigate: NavigateFunction) {
        verify().then(() => {
            api("PATCH", `blog`, {
                title,
                status
            })
                .then((response) => {
                    setBlog({
                        ...blog,
                        title: title,
                        status: status
                    });
                    setCreateBlog(false);
                    toast.success(response.message, {
                        position: "bottom-center"
                    });
                })
                .catch((response) => {
                    toast.error(response.message, {
                        position: "bottom-center"
                    });
                });
        }).catch(() => {
            logout();
            navigate("/");
        });
    },

    /**
     * Récupère les informations d'administration du blog.
     * @param {function} setHasAdminBlog - Fonction pour définir l'état d'administration du blog.
     * @param {function} setOtp - Fonction pour définir l'état OTP.
     */
    adminBlog(setHasAdminBlog: (hasAdminBlog: number) => void, setOtp: (otp: boolean) => void) {
        api("GET", `admin/blog`)
            .then((response) => {
                if (response.message) {
                    setHasAdminBlog(response.message);
                }
                setOtp(response.otp);
            })
            .catch((response) => {
                toast.error(response.message, {
                    position: "bottom-center"
                });
            });
    },
};

export default blog;