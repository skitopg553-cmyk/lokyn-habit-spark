import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface AuthGuardProps {
    children: ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
    const { session, loading } = useAuth();
    const location = useLocation();

    const { data: prenom, isLoading: prenomLoading } = useQuery<string | null>({
        queryKey: ["profile-prenom", session?.user?.id],
        queryFn: async () => {
            if (!session) return null;
            const { data } = await (supabase
                .from("user_profile")
                .select("prenom")
                .eq("auth_id", session.user.id)
                .maybeSingle() as any);
            return data?.prenom ?? null;
        },
        enabled: !!session,
        staleTime: 30000,
    });

    if (loading || (session && prenomLoading)) {
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

    if (prenom === "Alex" && location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};

export default AuthGuard;
