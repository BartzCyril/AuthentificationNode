import {Link} from "react-router-dom";

type DisplayBlogProps = {
    blog: Blog;
    adminBlogId: number | null;
}

const DisplayBlog = ({blog, adminBlogId}: DisplayBlogProps) => {
    return (
        <Link to={`/blog/${blog.id}`} key={blog.id}>
            <div
                className="bg-white w-full rounded-lg shadow-md flex flex-col transition-all overflow-hidden hover:shadow-2xl"
            >
                <div className="  p-6">
                    <h3 className="mb-4 font-semibold  text-2xl">{`${blog.id === adminBlogId ? "Mon blog" : "Blog"} : ${blog.title}`}
                    </h3>
                    <p className="text-sky-800 text-sm mb-0">
                        {`Ce blog est ${blog.status === "public" ? "public" : "privé"}`}
                    </p>
                </div>
                <div className="mt-auto">
                    <img src="https://picsum.photos/400/300" alt=""
                         className="w-full h-48 object-cover"/>
                </div>
            </div>
        </Link>
    )
}

export default DisplayBlog