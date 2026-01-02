import {useContext, useState} from "react";
import Input from "../components/Form/Input.tsx";
import {handleEmail, handlePassword} from "../helper/customer.ts";
import api from "../helper/api.ts";
import Error from "../components/Form/Error.tsx";
import Spinner from "../components/Spinner.tsx";
import {toast} from "react-toastify";
import {AuthContext} from "../context/AuthContext.tsx";
import {useNavigate} from "react-router-dom";
import { useEffect } from "react";

const Account = () => {
    const [changeEmail, setChangeEmail] = useState(false); // State pour gérer le changement d'email
    const [changePassword, setChangePassword] = useState(false); // State pour gérer le changement de mot de passe
    const [email, setEmail] = useState<string | null>(null); // State pour l'email
    const [password, setPassword] = useState<string | null>(null); // State pour le mot de passe
    const [lastPassword, setLastPassword] = useState<string | null>(null); // State pour l'ancien mot de passe
    const [error, setError] = useState<{ email: string | null, password: string | null, global: string | null }>({ // State pour les messages d'erreur
        email: null,
        password: null,
        global: null
    });
    const [isLoading, setIsLoading] = useState(false); // State pour gérer le chargement
    const context = useContext(AuthContext); // Utilisation du AuthContext
    const updateIdentifier = context.updateEmail; // Fonction pour mettre à jour l'email
    const id = context.email; // Récupération de l'email
    const navigate = useNavigate(); // Hook pour la navigation
    let title = "Changer vos informations"; // Titre par défaut

    const { logout } = useContext(AuthContext); // Utilisation de la fonction logout

    useEffect(() => {
        const token = localStorage.getItem('token'); // Récupération du token depuis le localStorage
        if (token) {
            api("POST", "verify") // Vérification du token
                .catch(() => {
                    // Le token ne correspond pas à un utilisateur connecté ou une erreur est survenue
                    logout()
                    navigate("/")
                })
        } else {
            navigate("/")
        }
    }, []);

    if (changeEmail) {
        title = "Changer votre email"
    } else if (changePassword) {
        title = "Changer votre mot de passe"
    }

    const handleIEmailWrapper = (newEmail: string) => handleEmail(newEmail, setError, setEmail, error);
    const handlePasswordWrapper = (newPassword: string) => handlePassword(newPassword, setError, setPassword, error);
    const handleLastPassword = (password: string) => {
        setLastPassword(password);
    }

    const onSubmitField = (fieldName: "email" | "password", value: string | null, successCallback: () => void) => {
        if (!value) { // Vérification si la valeur est définie
            setError({
                ...error,
                global: "Vous devez compléter tous les champs"
            });
            return;
        } else if (error[fieldName] !== null) {
            setError({
                ...error,
                global: "Vous devez d'abord corriger les erreurs avant de soumettre le formulaire"
            });
            return;
        } else if (fieldName === "password" && lastPassword === null || lastPassword?.trim().length === 0) {
            setError({
                ...error,
                global: "Vous devez entrer votre ancien mot de passe avant de changer votre mot de passe"
            });
            return;
        }

        const body = {
            [fieldName]: value
        };

        const update = () => {
            api( "PATCH", "update", body, `?id=${id}`)
                .then((response) => {
                    toast.success(response.message, {
                        position: "bottom-center"
                    });
                    if (fieldName === "identifier") {
                        updateIdentifier(value);
                    }
                    successCallback();
                })
                .catch(e => {
                    toast.error(e.message || "Une erreur s'est produite", {
                        position: "bottom-center"
                    });
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }

        setIsLoading(true);
        if (fieldName === "password") {
            // On test d'abord l'ancien mot de passe avant de pouvoir le changer
            api("POST", "login", {email: id, password: lastPassword})
                .then(() => {
                    // On modifie le mot de passe
                    update();
                })
                .catch(() => {
                    setIsLoading(false);
                    setError({
                        ...error,
                        global: "L'ancien mot de passe est incorrect"
                    });
                })
        } else {
            // On modifie l'identifiant
            update();
            // On déconnecte l'utilisateur pour qu'il se reconnecte avec son nouvel identifiant
            context.logout();
            navigate("/")
        }
    }

    const onSubmitEmail = () => { // Fonction pour soumettre le formulaire de changement d'email
        onSubmitField('email', email, () => {
            setChangeEmail(false);
        });
    }

    const onSubmitPassword = () => { // Fonction pour soumettre le formulaire de changement de mot de passe
        onSubmitField('password', password, () => {
            setChangePassword(false);
        });
    }

    const [mfaEnabled, setMfaEnabled] = useState(false); // State pour gérer l'activation de la double authentification
    const [qrCode, setQrCode] = useState(''); // State pour le QR code

    // On fait la demande d'activation de la double back
    const enableMfa = async () => {
        setIsLoading(true);
        try {
            const response = await api("POST", "enable-mfa", { email: id });
            setQrCode(response.qrcode); // Mise à jour du QR code
            setMfaEnabled(true); // Mise à jour de l'état de la double authentification

            localStorage.setItem("token", response.token); // Mise à jour du token dans le localStorage
            localStorage.setItem("otp", "true"); // Mise à jour de l'état OTP dans le localStorage

            toast.success('Double back activée avec succès', {
                position: "bottom-center"
            });
        } catch (error) {
            console.error('Erreur lors de l\'activation de la double back', error);
            toast.error('Erreur lors de l\'activation de la double back', {
                position: "bottom-center"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // On fait la demande de désactivation de la double back
    const disableMfa = async () => {
        setIsLoading(true);
        try {
            const response = await api("POST", "disable-mfa", { email: id });
            setQrCode(''); // Réinitialisation du QR code
            setMfaEnabled(false); // Mise à jour de l'état de la double authentification

            localStorage.setItem("otp", "false"); // Mise à jour de l'état OTP dans le localStorage
            localStorage.setItem("token", response.token); // Mise à jour du token dans le localStorage

            toast.success('Double back désactivée avec succès', {
                position: "bottom-center"
            });
        } catch (error) {
            console.error('Erreur lors de la désactivation de la double back', error);
            toast.error('Erreur lors de la désactivation de la double back', {
                position: "bottom-center"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // On vérifie si la double back est active
    useEffect(() => {
        const fetchMfaStatus = async () => {
            try {
                const response = await api("POST", "check-mfa-status", { email: id }); // Demande de vérification de l'état de la double authentification
                setMfaEnabled(response.mfaEnabled); // Mise à jour de l'état de la double authentification
            } catch (error) {
                console.error('Erreur lors de la vérification du statut de la double back', error);
            }
        };

        fetchMfaStatus();
    }, [id]);

    if (isLoading && !localStorage.getItem("token")) {
        return <Spinner/>
    }

    return (
        <div className="max-w-lg mx-auto  bg-white dark:bg-gray-800 rounded-lg shadow-md px-8 py-10 flex flex-col items-center">
            <h1 className="text-xl font-bold text-center text-gray-700 dark:text-gray-200 mb-8">
                {title}
            </h1>
            {(!changeEmail && !changePassword) && <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm mb-4 w-full" onClick={() => setChangeEmail(true)}>Changer votre email</button>}
            {(!changeEmail && !changePassword) && <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm mb-4 w-full" onClick={() => setChangePassword(true)}>Changer votre mot de passe</button>}
            {changeEmail && <form action="#" className="w-full flex flex-col gap-4">
                <Input type={"text"} name={"Identifiant"} errorMessage={error.email} handle={handleIEmailWrapper}/>
                <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm mt-2" onClick={onSubmitEmail} disabled={isLoading}>Changer votre identifiant</button>
                {isLoading && <Spinner/>}
                <button type="button" className="bg-gray-200 hover:bg-gray-300 text-blue font-medium py-2 px-4 rounded-md shadow-sm mb-4" onClick={() => setChangeEmail(false)}>Annuler</button>
            </form>}
            {changePassword && <form action="#" className="w-full flex flex-col gap-4">
                <Input type={"password"} name={"Ancien mot de passe"} handle={handleLastPassword}/>
                <Input type={"password"} name={"Mot de passe"} errorMessage={error.password} handle={handlePasswordWrapper}/>
                <button type="button" className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm mt-2" onClick={onSubmitPassword} disabled={isLoading}>Changer votre mot de passe</button>
                {isLoading && <Spinner/>}
                <button type="button" className="bg-gray-200 hover:bg-gray-300 text-blue font-medium py-2 px-4 rounded-md shadow-sm mb-4" onClick={() => setChangePassword(false)}>Annuler</button>
            </form>}
            {mfaEnabled ? (
                <button
                    onClick={disableMfa}
                    className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-md shadow-sm w-full">
                    Désactiver la double authentification
                </button>
            ) : (
                <button
                    type="button"
                    onClick={enableMfa}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm w-full">
                    Activer la double authentification
                </button>
            )}
            {qrCode && (
                <div className="mt-4">
                    <h2 className="text-lg font-bold text-center text-gray-700 dark:text-gray-200">Scannez le code QR avec votre application d'authentification</h2>
                    <img src={qrCode} alt="QR Code for MFA" className="mx-auto mt-4" />
                </div>
            )}
            <Error errorMessage={error.global}/>
        </div>
    )
};

export default Account;