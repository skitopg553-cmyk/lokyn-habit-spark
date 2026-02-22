import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const done = localStorage.getItem("onboarding_done");
    navigate(done ? "/home" : "/onboarding", { replace: true });
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#FF6B2B", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center" 
    }}>
      <div style={{ color: "white", fontSize: "24px", fontWeight: "bold", letterSpacing: "0.2em" }}>LOKYN</div>
    </div>
  );
};

export default Index;