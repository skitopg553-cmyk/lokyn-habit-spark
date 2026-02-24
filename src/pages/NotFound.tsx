import { useNavigate } from "react-router-dom";
import lokynDecu from "@/assets/lokyn-decu.png";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: "#0D0D0F", animation: "slide-up-fade 400ms ease-out both" }}
    >
      <img
        src={lokynDecu}
        alt="Lokyn déçu"
        className="w-48 h-48 object-contain mb-6 select-none"
      />
      <h1
        className="text-6xl font-bold mb-4"
        style={{ color: "#FF6B2B" }}
      >
        404
      </h1>
      <p className="text-xl font-bold mb-2">T'es perdu ? Lokyn aussi.</p>
      <p className="text-muted-foreground text-sm mb-10">
        Cette page n'existe pas. Comme ta motivation certains lundis.
      </p>
      <button
        onClick={() => navigate("/home")}
        className="px-8 py-4 rounded-xl font-bold text-white active:scale-95 transition-transform"
        style={{
          backgroundColor: "#FF6B2B",
          boxShadow: "0 8px 20px hsl(18 100% 56% / 0.35)",
        }}
      >
        Retour à l'accueil
      </button>
    </div>
  );
};

export default NotFound;
