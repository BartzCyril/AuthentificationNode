const express = require('express');
const bodyParser = require('body-parser');
const OAuth2Server = require('@node-oauth/oauth2-server');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({credentials: true, origin: "http://localhost:5173" /* pour le site en dev */ || "*" /* pour PostMan */}))

const db = new sqlite3.Database('token.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            access_token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            client_id TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table:', err.message);
            }
        });
    }
});

const oauth = new OAuth2Server({
    model: {
        getAccessToken: (token) => {
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM tokens WHERE access_token = ?', [token], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    if (!row) {
                        return resolve(null);
                    }
                    resolve({
                        accessToken: row.access_token,
                        accessTokenExpiresAt: new Date(row.expires_at),
                        client: { id: row.client_id },
                        user: { id: row.client_id }
                    });
                });
            });
        },
        saveToken: (token, client, user) => {
            return new Promise((resolve, reject) => {
                const accessTokenLifetime = token.accessTokenLifetime || 3600;
                const expiresAt = new Date();
                expiresAt.setSeconds(expiresAt.getSeconds() + accessTokenLifetime);
                if (isNaN(expiresAt.getTime())) {
                    console.error('Invalid expiration date generated');
                    return reject(new Error('Invalid expiration date'));
                }
                db.run('INSERT INTO tokens (access_token, expires_at, client_id) VALUES (?, ?, ?)',
                    [token.accessToken, expiresAt.toISOString(), client.id],
                    (err) => {
                        if (err) {
                            console.error('Error in saveToken:', err);
                            return reject(err);
                        }
                        resolve({
                            accessToken: token.accessToken,
                            accessTokenExpiresAt: expiresAt,
                            client: client,
                            user: { id: client.id } // no user for client_credentials grant type
                        });
                    }
                );
            });
        },
        getClient(clientId, clientSecret) {
            return {
                id: clientId,
                clientSecret: clientSecret,
                grants: ['client_credentials']
            };
        },
        grantTypeAllowed: (clientId, grantType) => {
            return new Promise((resolve, reject) => {
                if (clientId === 'client-id' && grantType === 'client_credentials') {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        },
        getUserFromClient: (client) => {
            return new Promise((resolve, reject) => {
                resolve({ id: client.id });
            });
        },
    },
    accessTokenLifetime: 3600,
    allowBearerTokensInQueryString: true
});

app.post('/oauth/token', (req, res) => {
    const request = new OAuth2Server.Request(req);
    const response = new OAuth2Server.Response(res);

    oauth.token(request, response)
        .then((token) => {
            res.json(token);
        })
        .catch((err) => {
            console.log(err)
            res.status(err.code || 500).json(err);
        });
});

app.post('/verify', (req, res) => {
    const request = new OAuth2Server.Request(req);
    const response = new OAuth2Server.Response(res);

    oauth.authenticate(request, response)
        .then((token) => {
            res.json({ valid: true, token: token });
        })
        .catch((err) => {
            res.status(err.code || 500).json({ valid: false, error: err.message });
        });
});

app.listen(3002, () => {
    console.log('Le serveur Oauth2 écoute sur le port 3002');
});
