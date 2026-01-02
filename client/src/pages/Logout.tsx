import {useContext, useEffect, useState} from "react";
import api from "../helper/api.ts";
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {AuthContext} from "../context/AuthContext.tsx";
import Spinner from "../components/Spinner.tsx";
import LogoutModal from "../components/LogoutModal.tsx";

const Logout = () => {
    const navigate = useNavigate(); // Hook pour la navigation
    const { logout } = useContext(AuthContext); // Utilisation de la fonction logout
    const [open, setOpen] = useState(false); // State pour l'ouverture du modal
    const [loading, setLoading] = useState(true); // State pour le chargement
    const [all, setAll] = useState<boolean | null>(null); // State pour la déconnexion de tous les appareils
    const [email, setEmail] = useState(""); // State pour l'email

    useEffect(() => {
        api( "POST","verify")
            .then((response) => {
                if (response.otp) {
                    setEmail(response.user);
                    setOpen(true);
                } else {
                    logoutOneOrAll(false);
                }
            })
            .catch(error => {
                // Le token ne correspond pas à un utilisateur connecté ou une erreur est survenue
                toast.error(error.message, {
                    position: "bottom-center"
                });
                logout();
                // On redirige l'utilisateur vers la page d'accueil
                navigate("/");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (typeof all !== "boolean") return;
        if (all) {
            logoutOneOrAll(true);
        } else {
            logoutOneOrAll(false);
        }
    }, [all]);

    const logoutOneOrAll = (all: boolean) => {
        const token = localStorage.getItem("token"); // Récupération du token dans le localStorage
        api("GET","logout", undefined, `?token=${token}&all=${all}`)
            .then((response) => {
                // On supprime le token du localStorage
                localStorage.removeItem("token");
                toast.success(response.message, {
                    position: "bottom-center"
                });
                logout();
                // On redirige l'utilisateur vers la page d'accueil
                navigate("/");
            })
            .catch(error => {
                // Une erreur est survenue
                toast.error(error.message, {
                    position: "bottom-center"
                });
                logout();
                // On redirige l'utilisateur vers la page d'accueil
                navigate("/");
            });
    }


    if (loading) {
        return <Spinner/>
    }

    if (open) {
        return <LogoutModal open={open} setOpen={setOpen} setAll={setAll} email={email}/>
    }

    return <></>
}

export default Logout