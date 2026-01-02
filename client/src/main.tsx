import React from 'react'
import ReactDOM from 'react-dom/client'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Login from "./pages/Login.tsx";
import Logout from "./pages/Logout.tsx";
import Error from "./pages/Error.tsx";
import Layout from "./components/Layout.tsx";
import Account from "./pages/Account.tsx";
import Blogs from "./pages/Blogs.tsx";
import {AuthProvider} from "./context/AuthContext.tsx";
import BlogComponent from "./pages/BlogComponent.tsx";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Layout />,
        errorElement: <Error />,
        children: [
            {
                path: '/login',
                element: <Login />,
            },
            {
                path: 'logout',
                element: <Logout />,
            },
            {
                path: 'account',
                element: <Account />,
            },
            {
                path: '/',
                element: <Blogs />,
            },
            {
                path: 'blog/:id',
                element: <BlogComponent />,
            }
        ]
    }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
      <AuthProvider>
          <RouterProvider router={router}/>
      </AuthProvider>
  </React.StrictMode>,
)
