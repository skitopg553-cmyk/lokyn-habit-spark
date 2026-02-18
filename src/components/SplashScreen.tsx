import { useState, useEffect } from "react";
import splashImage from "@/assets/splash.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1800);
    const finish = setTimeout(onFinish, 2300);
    return () => { clearTimeout(timer); clearTimeout(finish); };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <img
        src={splashImage}
        alt="LOKYN"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default SplashScreen;
