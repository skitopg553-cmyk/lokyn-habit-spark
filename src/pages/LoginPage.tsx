import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import lokynNeutre from "@/assets/lokyn-neutre.png";

const LoginPage = () => {
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (mode === "signin") {
            const { error } = await signIn(email, password);
            if (error) {
                setError("Email ou mot de passe incorrect.");
            } else {
                navigate("/home", { replace: true });
            }
        } else {
            const { error, prenom } = await signUp(email, password);
            if (error) {
                if (error.message.includes("already registered")) {
                    setError("Ce compte existe déjà. Connecte-toi.");
                } else if (error.message.includes("password")) {
                    setError("Mot de passe trop court (6 caractères minimum).");
                } else {
                    setError(error.message);
                }
            } else {
                if (prenom === "Alex") {
                    navigate("/onboarding", { replace: true });
                } else {
                    navigate("/home", { replace: true });
                }
            }
        }

        setLoading(false);
    };

    return (
        <div
            className="relative flex min-h-screen w-full flex-col items-center justify-center max-w-md mx-auto px-6"
            style={{ backgroundColor: "#0D0D0F" }}
        >
            {/* Lokyn mascot */}
            <div className="flex flex-col items-center mb-10" style={{ animation: "slide-up-fade 500ms ease-out both" }}>
                <img
                    src={lokynNeutre}
                    alt="Lokyn"
                    className="w-32 h-32 object-contain mb-6 select-none"
                />
                <h1
                    className="text-3xl font-bold tracking-tight"
                    style={{ color: "#FF6B2B" }}
                >
                    LOKYN
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Ta discipline. Ton poisson.
                </p>
            </div>

            {/* Toggle */}
            <div
                className="flex w-full bg-card rounded-xl p-1 mb-8"
                style={{ animation: "slide-up-fade 500ms ease-out 100ms both" }}
            >
                <button
                    onClick={() => { setMode("signin"); setError(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${mode === "signin"
                        ? "bg-primary text-white"
                        : "text-muted-foreground"
                        }`}
                >
                    Connexion
                </button>
                <button
                    onClick={() => { setMode("signup"); setError(null); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${mode === "signup"
                        ? "bg-primary text-white"
                        : "text-muted-foreground"
                        }`}
                >
                    Créer un compte
                </button>
            </div>

            {/* Form */}
            <form
                onSubmit={handleSubmit}
                className="w-full space-y-4"
                style={{ animation: "slide-up-fade 500ms ease-out 200ms both" }}
            >
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="ton@email.com"
                        className="w-full bg-card border border-white/10 rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-sm"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                        Mot de passe
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        placeholder="••••••••"
                        className="w-full bg-card border border-white/10 rounded-xl px-4 py-3.5 text-foreground outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 text-sm"
                    />
                </div>

                {/* Error message */}
                {error && (
                    <p
                        className="text-sm font-medium"
                        style={{ color: "#f87171", animation: "slide-up-fade 300ms ease-out both" }}
                    >
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-base text-white active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 mt-2"
                    style={{
                        backgroundColor: "#FF6B2B",
                        boxShadow: "0 8px 20px hsl(18 100% 56% / 0.35)",
                    }}
                >
                    {loading
                        ? "..."
                        : mode === "signin"
                            ? "Se connecter"
                            : "Créer mon compte"}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
