import Input from "../components/Form/Input.tsx";
import {useContext, useEffect, useRef, useState} from "react";
import Error from "../components/Form/Error.tsx";
import api from "../helper/api.ts";
import {useNavigate} from "react-router-dom";
import Spinner from "../components/Spinner.tsx";
import {handleEmail, handlePassword} from "../helper/customer.ts";
import {AuthContext} from "../context/AuthContext.tsx";
import MfaModal from "../components/MfaModal.tsx";
import {toast} from "react-toastify";
import { jwtDecode } from "jwt-decode";

const Login = () => {
    const [email, setEmail] = useState<string | null>(null); // State pour l'email
    const [password, setPassword] = useState<string | null>(null); // State pour le mot de passe
    const [isRegistration, setIsRegistration] = useState(true); // State pour gérer le mode inscription/connexion
    const [otp, setOtp] = useState<string | null>(null); // State pour le code OTP
    const [error, setError] = useState<{ email: string | null, password: string | null, global: string | null }>({ // State pour les messages d'erreur
        email: null,
        password: null,
        global: null
    });
    const navigate = useNavigate(); // Hook pour la navigation
    const [isLoading, setIsLoading] = useState(false); // State pour gérer le chargement
    const { login } = useContext(AuthContext); // Utilisation du AuthContext
    const [open, setOpen] = useState(false); // State pour gérer l'ouverture du modal MFA
    const [isMfa, setIsMfa] = useState(false); // State pour gérer l'état de la double authentification
    const oAuthEmail = useRef<string | null>(null); // Référence pour stocker l'email OAuth
    const isOAuthRegister = useRef<boolean>(false); // Référence pour stocker l'état d'inscription OAuth

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
        const decoded: {register: boolean, email: string} = jwtDecode(token);
        console.log(decoded.register, decoded.email);
        isOAuthRegister.current = decoded.register;
        oAuthEmail.current = decoded.email;
    }

    useEffect(() => {
        if (oAuthEmail.current !== null) {
            setEmail(oAuthEmail.current); // Mise à jour de l'email avec l'email OAuth
            if (isOAuthRegister.current) {
                setOpen(true); // Ouverture du modal MFA
                setIsMfa(true); // Activation de la double authentification
            } else {
                setIsLoading(true);
                api("POST", "check-mfa-status", {
                    email: oAuthEmail.current
                }) // Vérification de l'état de la double authentification
                    .then(data => {
                        if (data.mfaEnabled) {
                            setIsLoading(false);
                            setIsMfa(true); // Activation de la double authentification
                        } else {
                            api("POST", "oauth/login", {
                                email: oAuthEmail.current
                            })
                                .then((data) => {
                                    login(oAuthEmail.current as string); // Connexion
                                    localStorage.setItem("token", data.message); // Stockage du token dans le localStorage
                                    localStorage.setItem("otp", data.otp); // Stockage de l'état OTP dans le localStorage
                                    navigate("/"); // Navigation vers la page des blogs
                                })
                                .catch((e) => {
                                    toast.error(e.message, {
                                        position: "bottom-center"
                                    });
                                })
                                .finally(() => {
                                    setIsLoading(false);
                                });
                        }
                    })
                    .catch(e => {
                        toast.error(e.message, {
                            position: "bottom-center"
                        });
                        setIsLoading(false);
                    })
            }
        }
    }, []);

    const onSubmitMfa = () => { // Fonction pour soumettre le code OTP
        api("POST", "verifyOtp", {
            email,
            otp
        })
            .then(data => {
                if (data.status === "Erreur") {
                    toast.error(data.message, {
                        position: "bottom-center"
                    });
                    return;
                }
                login(email as string);
                localStorage.setItem("token", data.message);
                navigate("/");
            })
            .catch(e => {
                toast.error(e.message, {
                    position: "bottom-center"
                });
            })
    }

    const onSubmit = () => { // Fonction pour soumettre le formulaire de connexion ou d'inscription
        if (email === null || password === null) {
            setError({
                ...error,
                global: "Vous devez compléter tous les champs"
            });
            return;
        } else if (error.password !== null || error.email !== null) {
            setError({
                ...error,
                global: "Vous devez d'abord corriger les erreurs avant de soumettre le formulaire"
            });
            return;
        }
        // On fait une requête sur le serveur d'back
        setIsLoading(true);
        const data = {
            email,
            password
        };
        const apiCall = isRegistration ? api("POST", "register", data) : api("POST", "login", data);

        apiCall
            .then((data) => {
                if (isRegistration) {
                    setOpen(true);
                    return
                }
                if (data.message === null) {
                    setIsMfa(true);
                    return;
                }
                login(email); // Connexion
                localStorage.setItem("token", data.message); // Stockage du token dans le localStorage
                localStorage.setItem("otp", data.otp); // Stockage de l'état OTP dans le localStorage
                navigate("/"); // Navigation vers la page des blogs
            })
            .catch((e) => {
                setError({
                    ...error,
                    global: e.message || "Une erreur s'est produite"
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    useEffect(() => { 
        const token = localStorage.getItem('token');
        // On vérifie si un utilisateur est déjà connecté
        if (token) {
            api("POST", "verify")
                .then(() => {
                    // L'utilisateur est connecté, on le redirige vers la page d'accueil
                    navigate("/");
                })
                .catch(error => {
                    // Le token ne correspond pas à un utilisateur connecté ou une erreur est survenue
                    console.error(error);
                })
        }
    }, []);

    const discordLogin = () => {
        window.open("http://localhost:3000/discord", "_self") // Redirection vers la connexion Discord
    }

    const googleLogin = () => {
        window.open("http://localhost:3000/google", "_self") // Redirection vers la connexion Google
    }

    const handleEmailWrapper = (newEmail: string) => handleEmail(newEmail, setError, setEmail, error);
    const handlePasswordWrapper = (newPassword: string) => handlePassword(newPassword, setError, setPassword, error);

    if (open) {
        return <MfaModal open={open} setOpen={setOpen} setIsRegistration={setIsRegistration} email={email}/>
    }

    return (
        <div className="flex items-center justify-center">
            <div className="relative flex flex-col rounded-xl bg-transparent bg-clip-border text-gray-700 shadow-none">
                {!isMfa &&
                    <h4 className="block font-sans text-2xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                        {isRegistration ? "Inscrivez-vous" : "Connectez-vous"}
                    </h4>}
                {isMfa &&
                    <h4 className="block font-sans text-2xl font-semibold leading-snug tracking-normal text-blue-gray-900 antialiased">
                        {"Vérification en deux étapes"}
                    </h4>}
                {!isMfa &&
                    <p className="mt-1 block font-sans text-base font-normal leading-relaxed text-gray-700 antialiased">
                        {isRegistration ? "Entrez vos informations pour vous inscrire" : "Entrez vos informations pour vous connecter"}
                    </p>}
                <form className="mt-8 mb-2 w-80 max-w-screen-lg sm:w-96">
                    <div className="mb-4 flex flex-col gap-6">
                        {!isMfa && <Input type={"email"} name={"Email"} errorMessage={error.email}
                                          handle={handleEmailWrapper}/>}
                        {!isMfa && <Input type={"password"} name={"password"} errorMessage={error.password}
                               handle={handlePasswordWrapper}/>}
                        {isMfa && <Input type={"number"} name={"otp"} handle={setOtp as (newValue) => void}/>}

                        {!isMfa && <Error errorMessage={error.global}/>}
                    </div>
                    {isLoading && <Spinner/>}
                    {isMfa && <button
                        className="mt-6 block w-full select-none rounded-lg bg-pink-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                        data-ripple-light="true"
                        onClick={onSubmitMfa}
                    >
                        {"Valider"}
                    </button>}
                    {isMfa && <button
                        className="mt-6 block w-full select-none rounded-lg bg-pink-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                        data-ripple-light="true"
                        onClick={() => setIsMfa(false)}
                    >
                        {"Annuler"}
                    </button>}
                    {!isMfa && <button
                        className="mt-6 block w-full select-none rounded-lg bg-pink-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                        data-ripple-light="true"
                        onClick={onSubmit}
                    >
                        {isRegistration ? "Inscription" : "Connexion"}
                    </button>}
                    {!isMfa && !isRegistration && <button
                        className="mt-6 block w-full select-none rounded-lg bg-pink-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                        data-ripple-light="true"
                        onClick={discordLogin}
                    >
                        {"Se connecter avec Discord"}
                    </button>}
                    {!isMfa && !isRegistration && <button
                        className="mt-6 block w-full select-none rounded-lg bg-pink-500 py-3 px-6 text-center align-middle font-sans text-xs font-bold uppercase text-white shadow-md shadow-pink-500/20 transition-all hover:shadow-lg hover:shadow-pink-500/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                        data-ripple-light="true"
                        onClick={googleLogin}
                    >
                        {"Se connecter avec Google"}
                    </button>}
                    {!isMfa &&
                        <p className="mt-4 block text-center font-sans text-base font-normal leading-relaxed text-gray-700 antialiased">
                            {isRegistration ? "Vous avez déjà un compte ?" : "Vous n'avez pas de compte ?"}
                            <button
                                className="font-semibold text-pink-500 transition-colors hover:text-blue-700"
                                type="button"
                                onClick={() => {
                                    setIsRegistration(!isRegistration);
                                }}
                                disabled={isLoading}
                            >
                                {isRegistration ? "Connectez-vous" : "Inscrivez-vous"}
                            </button>
                        </p>}
                </form>
            </div>
        </div>
    )

}

export default Login