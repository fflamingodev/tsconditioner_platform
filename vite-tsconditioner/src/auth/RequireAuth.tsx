// src/auth/RequireAuth.tsx
// Guard React Router pour /restricted/* : si pas loggé → déclenche login() ; sinon → rend <Outlet/>.
// Donc RequireAuth vérifie si il y a qqc dans le localstorage. Sinon, -> keycloak par login et AuthContext
import {Navigate, Outlet, useLocation} from "react-router-dom";
import { useAuth } from "./AuthContext.tsx";
import {useEffect} from "react";
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "true";
export function RequireAuth() {

    const { isAuthenticated, login } = useAuth(); // login est un champ-fonction de AuthState
    const loc = useLocation();

    useEffect(() => {
        if (AUTH_DISABLED) return; // <-- empêche tout login() en mode disabled

        if (!isAuthenticated) {
            sessionStorage.setItem("post_login_path", loc.pathname + loc.search);
            login();
        }
    }, [isAuthenticated, login, loc.pathname, loc.search]);

    if (AUTH_DISABLED) {
        return <Outlet />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
        // return <div style={{ padding: 24 }}>Redirecting to login…</div>;
    }

    return <Outlet />;
}