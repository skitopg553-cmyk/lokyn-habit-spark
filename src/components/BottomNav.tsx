import { NavLink } from "react-router-dom";

const tabs = [
  { icon: "home", label: "Accueil", path: "/", fill: true },
  { icon: "checklist", label: "Habitudes", path: "/habits", fill: true },
  { icon: "bar_chart", label: "Stats", path: "/stats", fill: false },
  { icon: "group", label: "Social", path: "/social", fill: false },
  { icon: "person", label: "Profil", path: "/profile", fill: false },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-white/5 px-6 pt-3 pb-6 flex justify-around items-center z-40 max-w-md mx-auto">
      {tabs.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`material-symbols-outlined ${isActive ? "fill-1" : ""}`}>
                {tab.icon}
              </span>
              <span className="text-[10px] font-bold">{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
