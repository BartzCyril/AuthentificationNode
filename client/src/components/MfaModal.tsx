import api from "../helper/api.ts";
import {toast} from "react-toastify";
import {useContext, useState} from "react";
import {useNavigate} from "react-router-dom";
import {AuthContext} from "../context/AuthContext.tsx";

type MfaModalProps = {
    open: boolean,
    setOpen: (open: boolean) => void,
    email: string | null,
    setIsRegistration: (isRegistration: boolean) => void,
}

const MfaModal = ({open, setOpen, email, setIsRegistration}: MfaModalProps) => {
    const [imageUrl, setImageUrl] = useState<string>(""); // State pour l'URL de l'image QR code
    const navigate = useNavigate(); // Hook pour la navigation
    const { login } = useContext(AuthContext); // Utilisation de la fonction login depuis le contexte AuthContext
    if (!open) { // Si le modal n'est pas ouvert, on ne retourne rien
        return null;
    }

    const handleYes = () => {
        api("POST", "qrcode", {
            email,
        })
            .then(response => {
                toast.success("Vous pouvez scanner le qrcode", {
                    position: "bottom-center"
                });
                setImageUrl(response.message); // Mise à jour de l'URL de l'image QR code
            })
            .catch(e => {
                toast.error(e.message, {
                    position: "bottom-center"
                });
            })
    }

    const close = () => {
        if (email) {
            api("POST", "oauth/login", {
                email: email
            })
                .then((data) => {
                    login(email as string); // Connexion
                    localStorage.setItem("token", data.message); // Stockage du token dans le localStorage
                    localStorage.setItem("otp", data.otp); // Stockage de l'état OTP dans le localStorage
                    navigate("/"); // Navigation vers la page des blogs
                })
                .catch((e) => {
                    toast.error(e.message, {
                        position: "bottom-center"
                    });
                    setOpen(false); // Fermeture du modal
                })

        } else {
            setOpen(false); // Fermeture du modal
            setIsRegistration(false); // Mise à jour de l'état d'inscription
        }
    }

    return (
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
            <div className="max-h-full w-full max-w-xl overflow-y-auto sm:rounded-2xl bg-white">
                <div className="w-full">
                    <div className="m-8 my-20 max-w-[400px] mx-auto">
                        <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
                            <h2 className="text-2xl font-semibold">Voulez vous choisir la double authentification ?</h2>
                            <button onClick={() => {
                                setOpen(false);
                                setIsRegistration(false);
                            }}
                                    className="text-gray-500 hover:text-gray-700 focus:outline-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                     fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                     strokeLinejoin="round" className="feather feather-x">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <div className="flex mt-4 items-center justify-center">
                            {imageUrl === "" ?
                                <>
                                    <button type="button" onClick={handleYes}
                                            className="focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">Oui
                                    </button>
                                    <button type="button" onClick={close}
                                            className="focus:outline-none text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-900">Non
                                    </button>
                                </> : <img src={imageUrl} alt={"qrcode"}/>}
                                </div>
                                </div>
                                </div>
                                </div>
                                </div>
                                )
                            }

export default MfaModal;