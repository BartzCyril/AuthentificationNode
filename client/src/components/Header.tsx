import {Link, useNavigate} from "react-router-dom";
import {useContext, useEffect} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
import api from "../helper/api.ts";

const Header = () => {
    const {isConnected, email, login, logout} = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token'); // Récupération du token depuis le localStorage
        if (token) {
            api("POST", "verify")
                .then((response) => {
                    login(response.user)
                })
                .catch(() => {
                    // Le token ne correspond pas à un utilisateur connecté ou une erreur est survenue
                    logout()
                    navigate("/"); // Redirection vers la page d'accueil
                })
        } else {
            logout(); // Déconnexion dans le contexte
        }
    }, [isConnected, navigate, login, logout]);

    return (
        <header>
            <nav className="bg-white border-gray-200 px-4 py-2.5 dark:bg-gray-800">
                <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
                    <Link to={"/"} className="flex">
                        <img src="../../public/img/logo.svg" className="mr-3 h-6 sm:h-9"
                             alt="Projet Logo"/>
                        <span
                            className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Authentification</span>
                    </Link>
                    <div className="flex items-center lg:order-2">
                        {!isConnected &&
                            <Link to={"/"}
                                  className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
                                <p>Blogs</p>
                            </Link>}
                        {email &&
                            <p className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">Bonjour {email}</p>
                        }
                        {isConnected &&
                            <>
                                <Link to={"/"}
                                      className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
                                    <p>Voir les blogs</p>
                                </Link>
                                <Link to={"/account"}
                                      className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
                                    <p>Compte</p>
                                </Link>
                                <Link to={"/logout"}
                                      className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
                                    <p>Déconnexion</p>
                                </Link>
                            </>
                        }
                        {!isConnected &&
                            <Link to={"/login"}
                                  className="text-gray-800 dark:text-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300 font-medium rounded-lg text-xs px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:hover:bg-gray-700 focus:outline-none dark:focus:ring-gray-800">
                                <p>Connexion</p>
                            </Link>
                        }
                    </div>
                </div>
            </nav>
        </header>
    )
}

export default Header