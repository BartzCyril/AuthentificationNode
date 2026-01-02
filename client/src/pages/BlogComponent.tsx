import {useNavigate, useParams} from "react-router-dom";
import Spinner from "../components/Spinner.tsx";
import Button from "../components/Button.tsx";
import BlogHelper from "../helper/blog.ts";
import ArticleHelper from "../helper/article.ts";
import Input from "../components/Form/Input.tsx";
import SvgDeleteArticle from "../components/Blog/SvgDeleteArticle.tsx";
import HeaderArticle from "../components/Blog/HeaderArticle.tsx";
import {Link} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
import SvgEditArticle from "../components/Blog/SvgEditArticle.tsx";
import {verify} from "../helper/customer.ts";
import {Article, Blog} from "../types.ts";

const BlogComponent = () => {
    const {id} = useParams<{ id: string }>();
    const [adminBlogId, setAdminBlogId] = useState<number | null>(null);
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [admin, setAdmin] = useState(false);
    const [createBlog, setCreateBlog] = useState(false);
    const [updateBlog, setUpdateBlog] = useState(false);
    const [blogTitle, setBlogTitle] = useState("");
    const [blogStatus, setBlogStatus] = useState<"public" | "private">("public");
    const navigate = useNavigate();
    const [createArticle, setCreateArticle] = useState(false);
    const [updateArticle, setUpdateArticle] = useState(false);
    const [currentArticleId, setCurrentArticleId] = useState<number | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [articleTitle, setArticleTitle] = useState("");
    const [articleContent, setArticleContent] = useState("");
    const {email, isConnected, logout} = useContext(AuthContext);
    const [otp, setOtp] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        if (id) {
            if (isConnected) {
                verify()
                    .then(() => {
                        BlogHelper.getBlog(parseInt(id), setBlog, setAdmin);
                        ArticleHelper.getAllArticles(setArticles, parseInt(id), setLoading);
                        BlogHelper.adminBlog(setAdminBlogId, setOtp);
                    })
                    .catch(() => {
                        logout()
                        navigate("/")
                    })
            } else {
                BlogHelper.getBlog(parseInt(id), setBlog, setAdmin);
                ArticleHelper.getAllArticles(setArticles, parseInt(id), setLoading);
            }
        }
    }, [id, isConnected]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target?.files[0]);
        }
    }

    if (createArticle || updateArticle) {
        return (
            <div className="mb-4 flex flex-col gap-6">
                <Input type="text" name="Titre de l'article" handle={(value) => setArticleTitle(value as string)}
                       value={updateArticle ? articles[currentArticleId].title : ""}/>
                <Input type="textarea" name="Contenu de l'article"
                       handle={(value) => setArticleContent(value as string)}
                       value={updateArticle ? articles[currentArticleId].content : ""}/>
                {createArticle && <input type="file" onChange={handleFileChange} required />}
                {createArticle && <Button onClick={async () => {
                    await ArticleHelper.createArticle(parseInt(id as string), articleTitle, articleContent, email, setArticles, articles, logout, navigate, file as File)
                    setUpdateArticle(false)
                    setCreateArticle(false)
                }}
                                          buttonContent={"Créer mon article"}/>}
                {updateArticle && <Button
                    onClick={() => ArticleHelper.updateArticle(articleTitle, articleContent, setArticles, articles, articles[currentArticleId].id, setUpdateArticle, logout, navigate)}
                    buttonContent={"Modifier mon article"}/>}
            </div>
        )
    }

    if (createBlog || updateBlog) {
        return (
            <div className="mb-4 flex flex-col gap-6">
                <Input type="text" name="Titre du blog" handle={(value) => setBlogTitle(value as string)}
                       value={updateBlog ? blog?.title : ""}/>
                <Input type="checkbox" name="Voulez-vous mettre ce blog en privé ?"
                       handle={(value) => setBlogStatus(value === true ? "private" : "public")}
                       checked={blogStatus === "private"}/>
                {createBlog && <Button onClick={async () => {
                    const blog = await BlogHelper.createBlog(blogTitle, blogStatus, logout, navigate)
                    setUpdateBlog(false)
                    setCreateBlog(false)
                    navigate(`/blog/${blog}`)
                }}
                                       buttonContent={"Créer mon blog"}/>}
                {updateBlog && <Button
                    onClick={() => {
                        BlogHelper.updateBlog(blogTitle, blogStatus, setBlog, blog as Blog, setUpdateBlog, logout, navigate)
                    }}
                    buttonContent={"Modifier mon blog"}/>}
            </div>
        )
    }

    if (loading) {
        <Spinner/>
    }

    if (!blog) {
        return (
            <div>
                <p>Il n'y a aucun blog disponible !</p>
                {isConnected && !admin && otp && (
                    <Button onClick={() => {
                        setCreateBlog(true)
                    }} buttonContent={"Créer mon blog"}/>
                )}
            </div>
        );
    }

    if (articles.length > 0) {
        return (
            <div
                className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
                <div className="m-10 flex flex-col items-center mx-auto max-w-screen-lg">
                    {<div className="header flex-col w-full justify-center">
                        <h2 className="font-black pb-10 mb-0 text-5xl text-blue-900 text-center">{admin ? `Mon blog : ${blog?.title}` : `Bienvenue sur le blog : ${blog?.title}`}</h2>
                        <h3 className="text-center font-black pb-10 mb-20 text-4xl text-blue-900 before:block before:absolute before:bg-sky-300  relative before:w-1/3 before:h-1 before:bottom-0 before:left-1/3">{admin ? `Votre blog est ${blog.status === "private" ? "privé" : "public"}` : `Ce blog est ${blog.status === "private" ? "privé" : "public"}`}</h3>
                    </div>}
                    <div className={"flex mb-10 gap-10"}>
                        {isConnected && otp && !admin && adminBlogId ? (
                            <Link to={`/blog/${adminBlogId}`}>
                                <Button onClick={() => {
                                }} buttonContent={"Voir mon blog"}/>
                            </Link>
                        ) : isConnected && otp && !admin && (
                            <Button onClick={() => {
                                setCreateBlog(true)
                            }} buttonContent={"Créer mon blog"}/>
                        )}
                        {admin && otp &&
                            <Button onClick={() => setCreateArticle(true)} buttonContent={"Créer un article"}
                                    className={"mt-0"}/>}
                        {admin && otp &&
                            <Button onClick={() => {
                                BlogHelper.deleteBlog(blog?.id as number, setBlog, logout, navigate)
                            }}
                                    buttonContent={"Supprimer mon blog"} className={"mt-0"}/>}
                        {admin && otp &&
                            <Button onClick={() => {
                                setUpdateBlog(true)
                                setBlogStatus(blog?.status as "public" | "private")
                            }} buttonContent={"Modifier mon blog"}
                                    className={"mt-0"}/>}
                    </div>
                    <div className="grid w-full gap-10 grid-cols-3">
                        {articles.map((item: Article, index) => {
                            return (
                                <div
                                    className="bg-white w-full rounded-lg shadow-md flex flex-col transition-all overflow-hidden hover:shadow-2xl"
                                    key={item.id}>
                                    <div className="  p-6">
                                        <div
                                            className="pb-3 mb-4 border-b border-stone-200 text-xs font-medium flex justify-between text-blue-900">
                                            <HeaderArticle/>
                                            {admin && otp &&
                                                <button
                                                    className={"cursor-pointer"}
                                                    onClick={() => ArticleHelper.deleteArticle(item.id, articles, setArticles, logout, navigate)}
                                                    style={{width: "24px", height: "24px"}}
                                                >
                                                    <SvgDeleteArticle/>
                                                </button>
                                            }
                                            {
                                                admin && otp &&
                                                <button
                                                    className={"cursor-pointer"}
                                                    onClick={() => {
                                                        setUpdateArticle(true)
                                                        setCurrentArticleId(index)
                                                    }}
                                                    style={{width: "24px", height: "24px"}}
                                                >
                                                    <SvgEditArticle/>
                                                </button>
                                            }
                                        </div>
                                        <h3 className="mb-4 font-semibold  text-2xl">{item.title}
                                        </h3>
                                        <p className="text-sky-800 text-sm mb-0">
                                            {item.content}
                                        </p>

                                    </div>
                                    <div className="mt-auto">
                                        <img src={item.image} alt=""
                                             className="w-full h-48 object-cover"/>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        )
    } else {
        return (
            <div
                className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
                <div className="m-10 flex flex-col items-center mx-auto max-w-screen-lg">
                    {<div className="header flex-col w-full justify-center">
                        <h2 className="font-black pb-10 mb-0 text-5xl text-blue-900 text-center">{admin ? `Mon blog : ${blog?.title}` : `Bienvenue sur le blog : ${blog?.title}`}</h2>
                        <h3 className="text-center font-black pb-10 mb-20 text-4xl text-blue-900 before:block before:absolute before:bg-sky-300  relative before:w-1/3 before:h-1 before:bottom-0 before:left-1/3">{admin ? `Votre blog est ${blog.status === "private" ? "privé" : "public"}` : `Ce blog est ${blog.status === "private" ? "privé" : "public"}`}</h3>
                    </div>}
                    <div className={"flex-col mb-10 gap-10"}>
                        <p>Il n'y a aucun article disponible pour ce blog !</p>
                        <div className="flex gap-5 mt-5">
                            {admin && otp &&
                                <Button onClick={() => setCreateArticle(true)} buttonContent={"Créer un article"}
                                        className={"mt-0"}/>}
                            {admin && otp &&
                                <Button onClick={() => setUpdateBlog(true)} buttonContent={"Modifier mon blog"}
                                        className={"mt-0"}/>}
                            {admin && otp &&
                                <Button onClick={() => {
                                    BlogHelper.deleteBlog(blog?.id as number, setBlog, logout, navigate)
                                }}
                                        buttonContent={"Supprimer mon blog"} className={"mt-0"}/>}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


export default BlogComponent