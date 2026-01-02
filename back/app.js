const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express();
const Db = require("./helper/Db");
const Account = require("./model/Account");
const Blog = require("./model/Blog");
const Article = require("./model/Article")
const MfaController = require("./controller/MfaController");
const AccountController = require("./controller/AccountController");
const Token = require("./model/Token");
const BlogController = require('./controller/BlogController');
const DiscordController = require("./controller/DiscordController");
const OAuth = require("./model/OAuth");
const GoogleController = require("./controller/GoogleController");
const OauthController = require("./controller/OauthController");
const ArticleController = require('./controller/ArticleController');

require('dotenv').config()

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors({credentials: true, origin: "http://localhost:5173" /* pour le site en dev */ || "*" /* pour PostMan */}))

const db = new Db().db;

app.use((req, res, next) => {
    if (req.db) {
        next();
    } else {
        req.db = db;
        next();
    }
});

const account = new Account(db);
const token = new Token(db);
const oauth = new OAuth(db);
const mfaController = new MfaController(app, account, token);
const accountController = new AccountController(app, account, token);
const discordController = new DiscordController(app, oauth, account);
const blog = new Blog(db);
const blogController = new BlogController(app, account, blog);
const googleController = new GoogleController(app, oauth, account);
const oauthController = new OauthController(app, account, token);
const article = new Article(db);
const articleController = new ArticleController(app, account, blog, article);

app.listen(3000, () => {
    console.log("Le serveur back écoute sur le port 3000");
});
