import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import Login from "../components/Login";
import Home from "../components/Home";

const Router = () => {
    const { password, content, summary } = useAuthStore()

    return(
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<Navigate to="/" />} />
                <Route path="/" element={
                    password ? <Home content={content} deviceParams={summary}/> : <Login />
                }/>
            </Routes>
        </BrowserRouter>
    )
}

export default Router