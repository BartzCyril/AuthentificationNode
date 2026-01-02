export type Blog = {
    id: number;
    title: string;
    status: "public" | "private";
}

export type Article = {
    id: number;
    title: string;
    content: string;
    image: string;
}