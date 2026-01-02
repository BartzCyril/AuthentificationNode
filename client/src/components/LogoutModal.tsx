import Button from "./Button.tsx";
import {useState} from "react";
import Input from "./Form/Input.tsx";
import api from "../helper/api.ts";
import {toast} from "react-toastify";

type LogoutModalProps = {
    open: boolean,
    setOpen: (open: boolean) => void,
    setAll: (all: boolean) => void,
    email: string
}
const LogoutModal = ({open, setOpen, setAll, email}: LogoutModalProps) => {
    const [otp, setOtp] = useState(""); // Définition de l'état otp
    const [isAll, setIsAll] = useState(false); // Définition de l'état isAll

    const onSubmitMfa = () => { // Fonction pour soumettre le code OTP
        api("POST", "verifyOtp", { // Appel de l'API pour vérifier le code OTP
            email,
            otp
        })
            .then(data => {
                if (data.status === "Erreur") { // Si l'API retourne une erreur
                    toast.error(data.message, { // Afficher une notification d'erreur
                        position: "bottom-center"
                    });
                    return;
                }
                setOpen(false); // Fermer le modal
                setAll(true); // Définir isAll à true
            })
            .catch(e => {
                toast.error(e.message, {
                    position: "bottom-center"
                });
            })
    }

    if (isAll) { // Si isAll est true, afficher le champ OTP et le bouton de validation
        return (
            <>
                <Input type={"number"} name={"otp"} handle={setOtp as (newValue) => void}/>
                <Button onClick={onSubmitMfa} buttonContent={"Valider"}/>
            </>
        )
    }

    if (!open) {
        return null;
    }

    return (
        <div className="fixed left-0 top-0 flex h-full w-full items-center justify-center bg-black bg-opacity-50 py-10">
            <div className="max-h-full w-full max-w-xl overflow-y-auto sm:rounded-2xl bg-white">
                <div className="w-full">
                    <div className="m-8 my-20 max-w-[400px] mx-auto">
                        <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
                            <h2 className="text-2xl font-semibold">Voulez vous déconnecter tous vos appareils ?</h2>
                            <button onClick={() => {
                                setOpen(false);
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
                        <div className="flex justify-center gap-5">
                            <Button onClick={() => {
                                setIsAll(true);
                            }} buttonContent={"Oui"}/>
                            <Button onClick={() => {
                                setOpen(false);
                                setAll(false);
                            }} buttonContent={"Non"}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


export default LogoutModal