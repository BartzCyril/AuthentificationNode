const express = require('express');
const bodyParser = require('body-parser');
const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const mime = require('mime-types');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors({credentials: true, origin: "http://localhost:5173" /* pour le site en dev */ || "*" /* pour PostMan */}))

const db = new sqlite3.Database('image.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS image (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL, 
            url VARCHAR(255) NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table:', err.message);
            }
        });
    }
});

app.use((req, res, next) => {
    req.db = db;
    next();
});

app.get('/image', (req, res) => {
    const { articleId } = req.query;

    req.db.get(`SELECT * FROM image WHERE article_id = ?`, [articleId], (err, row) => {
        if (err) {
            return res.status(500).send({ status: "Erreur", message: err.message });
        }

        if (!row) {
            return res.status(404).send({ status: "Erreur", message: "Aucune image trouvée" });
        }

        const filePath = path.join(__dirname, row.url);
        const mimeType = mime.lookup(filePath);

        fs.readFile(filePath, { encoding: 'base64' }, (err, data) => {
            if (err) {
                return res.status(500).send({ status: "Erreur", message: err.message });
            }

            res.status(200).send({
                status: "Succès",
                image: data,
                mimeType: mimeType
            });
        });
    });
});

app.post('/upload', (req, res) => {
    const form = new multiparty.Form();
    form.parse(req, (error, fields, files) => {
        if (error) {
            return res.status(500).send(
            {
                status: "Erreur",
                message: error.message
            });
        }

        const articleId = fields.articleId[0];
        const token = fields.token[0];
        const file = files.files[0];
        const uploadPath = path.join(__dirname, 'files', file.originalFilename);

        fetch('http://localhost:3002/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ token: token })
        })
            .then(response => response.json())
            .then(data => {
                if (!data.valid) {
                    return res.status(401).send({ status: "Erreur", message: "Token invalide" });
                }

                fs.rename(file.path, uploadPath, (err) => {
                    if (err) {
                        return res.status(500).send({ status: "Erreur", message: err.message });
                    }

                    const fileUrl = `/files/${file.originalFilename}`;

                    req.db.run(`INSERT INTO image (article_id, url) VALUES (?, ?)`, [articleId, fileUrl], function (err) {
                        if (err) {
                            return res.status(500).send({ status: "Erreur", message: err.message });
                        }

                        res.status(200).send({ status: "Succès", message: "Image ajoutée" });
                    });
                });
            })
            .catch(err => {
                res.status(500).send({ status: "Erreur", message: err.message });
            });
    });
});

app.use('/files', express.static(path.join(__dirname, 'files')));

app.listen(3001, () => {
    console.log("Le serveur image écoute sur le port 3001");
});
