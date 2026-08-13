import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import AiChat from "../pages/AiChat";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "";

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );

  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current;

      localStorage.setItem("sidebarCollapsed", String(next));

      return next;
    });
  };

  const logout = () => {
    localStorage.clear();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-100">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={toggleSidebar}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={logout}
        role={role}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onLogout={logout} onMenuClick={() => setMobileOpen(true)} />

        <main
          className="
            min-h-0 flex-1
            overflow-y-auto overflow-x-hidden
            p-4 md:p-6

            [scrollbar-width:thin]
            [scrollbar-color:#94a3b8_transparent]
          "
        >
          <Outlet />
        </main>
      </div>

      <AiChat />
    </div>
  );
}
