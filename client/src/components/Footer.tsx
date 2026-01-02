const Footer = () => {
    return (
        <footer className="dark:bg-gray-800 text-white mt-5 inherit">
            <div className="container mx-auto py-4">
                <div className="flex flex-wrap">
                    <div className="w-full md:w-1/2 mb-4 md:mb-0">
                        <h5 className="text-lg font-bold">À propos de nous</h5>
                        <p>
                            Authentication est un prjet testant <br />différentes configurations d'authentification.
                        </p>
                    </div>
                    <div className="w-full md:w-1/4 mb-4 md:mb-0">
                        <h5 className="text-lg font-bold">Liens utiles</h5>
                        <ul className="list-none">
                            <li><a href="/" className="text-white">Blog</a></li>
                        </ul>
                    </div>
                    <div className="w-full md:w-1/4">
                        <h5 className="text-lg font-bold">Contact</h5>
                        <ul className="list-none">
                            <li>Cyril Bartz</li>
                            <li>Sergio Gonzalez</li>
                            <li>Alexis Metton</li>
                        </ul>
                    </div>
                </div>
                <div className="text-center mt-3">
                    <p>&copy; 2024 Authentification. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer;
