import {useContext, useEffect, useState} from "react";
import BlogHelper from "../helper/blog.ts";
import {useNavigate} from "react-router-dom";
import Spinner from "../components/Spinner.tsx";
import {AuthContext} from "../context/AuthContext.tsx";
import Button from "../components/Button.tsx";
import Input from "../components/Form/Input.tsx";
import DisplayBlog from "../components/Blog/DisplayBlog.tsx";
import {BlogStatus} from "../enums.ts";

const Blogs = () => {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [adminBlogId, setAdminBlogId] = useState<number | null>(null);
    const {isConnected} = useContext(AuthContext); 
    const [createBlog, setCreateBlog] = useState(false);
    const [blogTitle, setBlogTitle] = useState("");
    const [blogStatus, setBlogStatus] = useState<"public" | "private">("public");
    const navigate = useNavigate();
    const [otp, setOtp] = useState(false);
    const [currentBlogStatus, setCurrentBlogStatus] = useState<BlogStatus>(BlogStatus.ALL);
    const {logout} = useContext(AuthContext);

    useEffect(() => {
        BlogHelper.getBlogs(setBlogs, setIsLoading, isConnected)
        if (isConnected) {
            BlogHelper.adminBlog(setAdminBlogId, setOtp);
        }
    }, [isConnected]);

    if (isLoading) {
        return <Spinner/>
    }

    const filteredPrivateBlogs = blogs.filter(blog => blog.status === "private")
    const filteredPublicBlogs = blogs.filter(blog => blog.status === "public")

    if (createBlog) {
        return (
            <div className="mb-4 flex flex-col gap-6">
                <Input type="text" name="Titre du blog" handle={(value) => setBlogTitle(value as string)}/>
                <Input type="checkbox" name="Voulez-vous mettre ce blog en privé ?"
                       handle={(value) => setBlogStatus(value === true ? "private" : "public")}
                       checked={blogStatus === "private"}/>
                {createBlog && <Button onClick={async () => {
                    const blog = await BlogHelper.createBlog(blogTitle, blogStatus, logout, navigate)
                    setCreateBlog(false)
                    navigate(`/blog/${blog}`)
                }} buttonContent={"Créer mon blog"}/>}
            </div>
        )
    }

    if (!blogs.length) {
        return (
            <div className="flex justify-center flex-col items-center">
                <p className="text-center">Aucun blog disponible</p>
                {isConnected && !adminBlogId && otp && (
                <Button onClick={() => {
                    setCreateBlog(true)
                }} buttonContent={"Créer mon blog"}/>
                )}
            </div>
        )

    }

    return (
        <div className="flex flex-col ml-5">
            {isConnected && !adminBlogId && otp && <Button onClick={() => {
                setCreateBlog(true)
            }} buttonContent={"Créer mon blog"} className="mb-5"/>
            }
            {isConnected && <div className="flex gap-5 mb-5">
                <Button onClick={() => setCurrentBlogStatus(BlogStatus.ALL)} buttonContent={"Voir tous les blogs"}/>
                <Button onClick={() => setCurrentBlogStatus(BlogStatus.PUBLIC)} buttonContent={"Voir les blogs public"}/>
                <Button onClick={() => setCurrentBlogStatus(BlogStatus.PRIVATE)} buttonContent={"Voir les blogs privé"}/>
            </div>}
            <div className="grid w-full gap-10 grid-cols-3">
                {currentBlogStatus === BlogStatus.ALL && blogs.map((blog: Blog) => {
                    return (
                        <DisplayBlog blog={blog} adminBlogId={adminBlogId} key={blog.id}/>
                    )
                })}
                {currentBlogStatus === BlogStatus.PRIVATE && filteredPrivateBlogs.map((blog: Blog) => {
                    return (
                        <DisplayBlog blog={blog} adminBlogId={adminBlogId} key={blog.id}/>
                    )
                })}
                {currentBlogStatus === BlogStatus.PUBLIC && filteredPublicBlogs.map((blog: Blog) => {
                    return (
                        <DisplayBlog blog={blog} adminBlogId={adminBlogId} key={blog.id}/>
                    )
                })}
            </div>
        </div>
    )
}

export default Blogs