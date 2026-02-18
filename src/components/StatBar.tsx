import { useEffect, useRef, useState } from "react";

interface StatBarProps {
  label: string;
  value: number;
  delay?: number;
}

const StatBar = ({ label, value, delay = 0 }: StatBarProps) => {
  const [width, setWidth] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}%</span>
      </div>
      <div className="h-1.5 w-full bg-card rounded-full overflow-hidden border border-white/5">
        <div
          ref={barRef}
          className="h-full bg-primary rounded-full transition-all duration-800 ease-out"
          style={{
            width: `${width}%`,
            transitionDuration: "800ms",
            boxShadow: width > 0 ? "0 0 8px hsl(18 100% 56% / 0.5)" : "none",
          }}
        />
      </div>
    </div>
  );
};

export default StatBar;
