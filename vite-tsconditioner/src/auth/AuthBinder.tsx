
import { bindAuth } from "../http/axiosApi.ts";
import { useAuth } from "./AuthContext.tsx";

export function AuthBinder({ children }: { children: React.ReactNode }) {
    const { getValidAccessToken, logout } = useAuth();
    bindAuth(getValidAccessToken, logout);
    return <>{children}</>;
}