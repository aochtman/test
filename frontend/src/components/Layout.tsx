import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useVramManager } from "../hooks/useVramManager";

export default function Layout() {
  useVramManager();

  return (
    <div className="flex h-screen bg-dark-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
