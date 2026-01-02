const { getToken } = require("../helper/Jwt"); // Importation de la fonction getToken depuis le fichier helper/Jwt

class OauthController {
    app = null; // Initialisation de la variable app à null
    Account = null; // Initialisation de la variable Account à null
    Token = null; // Initialisation de la variable Token à null

    constructor(app, Account, Token) { // Constructeur qui prend l'application, Account et Token en paramètres
        this.app = app; // Assignation de l'application à l'instance
        this.Account = Account; // Assignation de Account à l'instance
        this.Token = Token; // Assignation de Token à l'instance
        this.login(); // Appel de la méthode login pour définir la route de connexion
    }

    login() { // Méthode pour définir la route de connexion OAuth
        this.app.post("/oauth/login", async (req, res) => { // Définition de la route POST pour /oauth/login
            const { email } = req.body; // Récupération de l'email depuis le corps de la requête
            const getId = await this.Account.getId(email); // Appel de la méthode getId pour obtenir l'ID du compte
            if (getId.status !== 200) { // Si l'ID n'est pas trouvé
                return res.status(getId.status).send({
                    status: "Erreur",
                    message: getId.message
                });
            }
            const token = getToken(email, null); // Génération d'un token JWT
            const insertToken = await this.Token.insertToken(getId.message, token); // Insertion du token dans la base de données
            if (insertToken.status !== 200) { // Si l'insertion échoue
                return res.status(insertToken.status).send({
                    status: "Erreur",
                    message: insertToken.message
                });
            } else { // Si l'insertion réussit
                return res.status(200).send({
                    status: "Succès",
                    message: token
                });
            }
        });
    }
}

module.exports = OauthController; // Exportation de la classe OauthController pour utilisation externe