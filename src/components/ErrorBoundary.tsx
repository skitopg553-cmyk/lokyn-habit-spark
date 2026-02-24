import { Component, ErrorInfo, ReactNode } from "react";
import lokynChute from "@/assets/lokyn-chute.png";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[ErrorBoundary] Lokyn a planté :", error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
                    style={{ backgroundColor: "#0D0D0F" }}
                >
                    <img
                        src={lokynChute}
                        alt="Lokyn chute"
                        className="w-40 h-40 object-contain mb-6 select-none"
                    />
                    <h1 className="text-xl font-bold mb-2">Lokyn a planté.</h1>
                    <p className="text-muted-foreground text-sm mb-8">Probablement ta faute.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 rounded-xl font-bold text-white active:scale-95 transition-transform"
                        style={{ backgroundColor: "#FF6B2B" }}
                    >
                        Réessayer
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
