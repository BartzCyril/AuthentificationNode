import api from "./api.ts";
import {toast} from "react-toastify";

/**
 * Cette fonction permet de réinitialiser les erreurs d'un formulaire
 * @param properties - Les propriétés à réinitialiser {Array<'identifier' | 'password' | 'global'>}
 * @param setError - La fonction de modification des erreurs {React.Dispatch<React.SetStateAction<{
 * @param error - Les erreurs actuelles {object}
 */
export const resetError = (
    properties: Array<'email' | 'password' | 'global'>,
    setError: React.Dispatch<React.SetStateAction<{
        email: string | null,
        password: string | null,
        global: string | null
    }>>,
    error: { email: string | null, password: string | null, global: string | null }
) => {
    for (const property of properties) {
        if (property in error) {
            setError((prevError) => ({
                ...prevError,
                [property]: null
            }));
        }
    }
};

/**
 * Cette fonction permet de gérer l'identifiant d'un formulaire
 * @param newIdentifier - Le nouvel identifiant {string}
 * @param setError - La fonction de modification des erreurs {React.Dispatch<React.SetStateAction<{
 * @param setIdentifier - La fonction de modification de l'identifiant {React.Dispatch<React.SetStateAction<string | null>>}
 * @param error - Les erreurs actuelles {object}
 */
export const handleEmail = (
    newEmail: string,
    setError: React.Dispatch<React.SetStateAction<{
        email: string | null,
        password: string | null,
        global: string | null
    }>>,
    setEmail: React.Dispatch<React.SetStateAction<string | null>>,
    error: { email: string | null, password: string | null, global: string | null },
) => {
    const regexEmail = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g; // Regex pour valider l'email
    if (!newEmail.match(regexEmail)) { // Si l'email n'est pas valide
        setError(prevError => ({
            ...prevError, // Conservation des autres erreurs
            email: "L'email n'est pas valide", // Définition de l'erreur d'email
            global: null // Réinitialisation de l'erreur globale
        }));
    } else {
        resetError(['email', 'global'], setError, error); // Réinitialisation des erreurs d'email et globale si l'email est valide
    }
    setEmail(newEmail); // Mise à jour de l'email
}

/**
 * Cette fonction permet de gérer le mot de passe d'un formulaire
 * @param newPassword - Le nouveau mot de passe {string}
 * @param setError - La fonction de modification des erreurs {React.Dispatch<React.SetStateAction<{
 * @param setPassword - La fonction de modification du mot de passe {React.Dispatch<React.SetStateAction<string>>}
 * @param error - Les erreurs actuelles {object}
 */
export const handlePassword = (
    newPassword: string,
    setError: React.Dispatch<React.SetStateAction<{
        email: string | null,
        password: string | null,
        global: string | null
    }>>,
    setPassword: React.Dispatch<React.SetStateAction<string | null>>,
    error: { email: string | null, password: string | null, global: string | null },
) => {
    if (newPassword.trim().length < 8) { // Si le mot de passe a moins de 8 caractères
        setError({
            ...error, // Conservation des autres erreurs
            password: "Le mot de passe doit contenir au moins 8 caractères", // Définition de l'erreur de mot de passe
            global: null // Réinitialisation de l'erreur globale
        });
    } else {
        resetError(['password', 'global'], setError, error); // Réinitialisation des erreurs de mot de passe et globale si le mot de passe est valide
    }
    setPassword(newPassword); // Mise à jour du mot de passe
}

/**
 * Vérifie la validité du token de l'utilisateur.
 * @returns {Promise<number>} - Retourne une promesse qui résout à l'ID de l'utilisateur si le token est valide.
 * @throws {Error} - Lance une erreur si la vérification échoue.
 */
export const verify = async () => {
    try {
        const response = await api("POST", "verify");
        return response.message.id;
    } catch (error) {
        toast.error(error.message, {
            position: "bottom-center"
        });
        throw error;
    }
}