import { NavLink } from "react-router-dom";
import VramIndicator from "./VramIndicator";

const NAV_ITEMS = [
  { to: "/txt2img", label: "Text to Image" },
  { to: "/img2img", label: "Image to Image" },
  { to: "/img2vid", label: "Image to Video" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-dark-800 border-r border-dark-700 flex flex-col h-screen">
      <div className="px-4 py-5 border-b border-dark-700">
        <h1 className="text-lg font-bold text-dark-50">AI Generator</h1>
        <p className="text-xs text-dark-400 mt-0.5">Local & Unrestricted</p>
      </div>

      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-dark-700 text-white border-r-2 border-blue-500"
                  : "text-dark-300 hover:bg-dark-700/50 hover:text-dark-100"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-dark-700">
        <VramIndicator />
      </div>
    </aside>
  );
}
