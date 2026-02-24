import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AuthGuardProps {
    children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const { session, loading } = useAuth();

    if (loading) {
        return (
            <div
                className="flex min-h-screen items-center justify-center"
                style={{ backgroundColor: "#0D0D0F" }}
            >
                <span
                    className="text-2xl font-bold tracking-[0.3em]"
                    style={{ color: "#FF6B2B", animation: "badge-pulse 1.5s ease-in-out infinite" }}
                >
                    LOKYN
                </span>
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
