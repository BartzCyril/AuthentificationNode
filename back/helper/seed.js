// Blogs de démonstration : insérés une seule fois, uniquement si aucun blog n'existe encore
const DEMO_EMAIL = 'demo@devauth.fr'; // compte sans mot de passe : impossible de s'y connecter

const BLOGS = [
    {
        title: 'Carnet de sécurité web',
        articles: [
            ['Pourquoi hacher les mots de passe avec bcrypt ?', "Un mot de passe ne doit jamais être stocké en clair. bcrypt ajoute un sel unique et un coût de calcul réglable : même si la base fuit, retrouver les mots de passe d'origine devient extrêmement long."],
            ['La double authentification expliquée simplement', "Le TOTP génère un code à 6 chiffres toutes les 30 secondes à partir d'un secret partagé entre le serveur et ton application d'authentification. Sans ton téléphone, un mot de passe volé ne suffit plus."],
            ['JWT : ce qu’il faut savoir', "Un JWT est signé, pas chiffré : n'y mets jamais de données sensibles. Garde une durée de vie courte et enregistre les tokens côté serveur si tu veux pouvoir les révoquer."]
        ]
    },
    {
        title: 'Journal d’un développeur Node.js',
        articles: [
            ['Structurer une API Express', "Séparer routes, contrôleurs et modèles rend le code plus lisible et plus simple à tester. Chaque contrôleur reçoit ses dépendances (base, modèles) dans son constructeur."],
            ['SQLite pour les petits projets', "SQLite ne demande aucun serveur : un seul fichier suffit. Idéal pour un prototype ou une démo, à condition d'activer les clés étrangères avec PRAGMA foreign_keys=ON."]
        ]
    },
    {
        title: 'OAuth2 sans prise de tête',
        articles: [
            ['Se connecter avec Google ou Discord', "Le fournisseur authentifie l'utilisateur puis redirige vers ton callback avec un code. Ton serveur échange ce code contre un profil : tu n'as jamais accès au mot de passe."],
            ['Le flux client_credentials', "Quand un service parle à un autre service, sans utilisateur, il présente son identifiant et son secret au serveur d'autorisation et reçoit un token d'accès de courte durée."]
        ]
    }
];

function seed(db) {
    db.serialize(() => { // s'exécute après les CREATE TABLE déjà mis en file par les modèles
        db.run('INSERT OR IGNORE INTO account (email) VALUES (?)', [DEMO_EMAIL]);
        db.get('SELECT COUNT(*) AS n FROM blog', (err, row) => {
            if (err || row.n > 0) return;
            db.serialize(() => {
                for (const blog of BLOGS) {
                    db.run('INSERT INTO blog (account_id, title, status) VALUES ((SELECT id FROM account WHERE email = ?), ?, "public")', [DEMO_EMAIL, blog.title]);
                    for (const [title, content] of blog.articles) {
                        db.run('INSERT INTO article (blog_id, title, content) VALUES ((SELECT MAX(id) FROM blog), ?, ?)', [title, content]);
                    }
                }
            });
        });
    });
}

module.exports = seed;
