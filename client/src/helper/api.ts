/**
 * Cette fonction permet de faire des appels à l'API
 * @param method - La méthode de l'appel (POST, GET, PATCH) {string}
 * @param action - L'action à effectuer {string}
 * @param body - Le corps de la requête {object}
 * @param params - Les paramètres de la requête {string}
 * @param headers - Les headers de la requête {object}
 */
const api = async (method: 'POST' | 'GET' | 'PATCH' | 'DELETE', action: string, body: object = {}, params:string = "", headers: object = {}) => {
    const token = localStorage.getItem('token'); // Récupération du token depuis le localStorage

    if (token) { // Si le token existe, on l'ajoute aux headers
        headers = { ...headers, "token": token };
    }

    const payload: RequestInit = { // Création de l'objet payload pour la requête fetch
        method,
        headers: {
            "Content-Type": "application/json", // Ajout du header Content-Type
            ...headers, // Ajout des headers supplémentaires
        },
        credentials: "include" // Inclusion des credentials (cookies, etc.)
    };

    if (method !== 'GET') { // Si la méthode n'est pas GET, on ajoute le corps de la requête
        payload.body = JSON.stringify(body);
    }

    const response = await fetch(`http://localhost:3000/${action}${params}`, payload); // Envoi de la requête fetch
    const responseJson = await response.json(); // Conversion de la réponse en JSON
    if (response.status === 200 || response.status === 201) { // Vérification du statut de la réponse
        return responseJson; // Retourne la réponse JSON si le statut est 200 ou 201
    } else {
        throw new Error(responseJson.message); // Lève une erreur si le statut n'est pas 200 ou 201
    }
}

export default api;
