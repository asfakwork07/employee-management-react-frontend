import { NavLink } from "react-router-dom";

const menuItems = [
  {
    path: "/dashboard",
    icon: "bi-speedometer2",
    label: "Dashboard",
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    path: "/employees",
    icon: "bi-people",
    label: "Employees",
    roles: ["ADMIN"],
  },
  {
    path: "/attendance",
    icon: "bi-clock-history",
    label: "Attendance",
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    path: "/leaves",
    icon: "bi-calendar2-check",
    label: "Leaves",
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    path: "/salary",
    icon: "bi-cash-stack",
    label: "Salary",
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    path: "/holidays",
    icon: "bi-calendar-event",
    label: "Holidays",
    roles: ["ADMIN", "EMPLOYEE"],
  },
  {
    path: "/roles",
    icon: "bi-shield-check",
    label: "Roles",
    roles: ["ADMIN"],
  },
  {
    path: "/settings",
    icon: "bi-gear",
    label: "Settings",
    roles: ["ADMIN"],
  },
  {
    path: "/profile",
    icon: "bi-person-circle",
    label: "Profile",
    roles: ["EMPLOYEE"],
  },
];

export default function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
  onLogout,
  role,
}) {
  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          flex h-[100dvh] flex-col
          overflow-visible
          bg-slate-900 text-white
          transition-[width,transform] duration-300 ease-in-out

          lg:static lg:translate-x-0

          ${collapsed ? "lg:w-[84px]" : "lg:w-[268px]"}

          ${
            mobileOpen
              ? "w-[268px] translate-x-0"
              : "w-[268px] -translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* =========================================
            HEADER / LOGO
        ========================================== */}

        <div
          className={`
            relative
            flex h-20 shrink-0 items-center
            border-b border-slate-800

            ${collapsed ? "lg:justify-center lg:px-2" : "justify-between px-5"}
          `}
        >
          <img
            src="/ems-logo.svg"
            alt="EMS Logo"
            className={`
              object-contain
              brightness-0 invert
              transition-all duration-300

              ${
                collapsed
                  ? "h-10 w-10 lg:h-10 lg:w-10"
                  : "h-14 w-auto max-w-[170px]"
              }
            `}
          />

          {/* Desktop collapse / expand */}
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`
              hidden lg:flex
              absolute top-1/2
              -translate-y-1/2
              items-center justify-center
              cursor-pointer
              transition-all duration-200

              ${
                collapsed
                  ? "-right-4 h-9 w-9 rounded-full border border-slate-700 bg-slate-800 text-slate-300 shadow-lg hover:bg-blue-600 hover:text-white"
                  : "right-4 h-9 w-9 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white"
              }
            `}
          >
            <i
              className={`bi ${
                collapsed ? "bi-chevron-right" : "bi-chevron-left"
              } text-base`}
            />
          </button>

          {/* Mobile close */}
          <button
            type="button"
            onClick={onMobileClose}
            title="Close Menu"
            className="
              flex h-9 w-9
              cursor-pointer
              items-center justify-center
              rounded-lg
              text-slate-300
              transition
              hover:bg-slate-800
              hover:text-white
              lg:hidden
            "
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* =========================================
            NAVIGATION
        ========================================== */}

        <nav
          className="
            min-h-0 flex-1
            overflow-y-auto overflow-x-visible
            px-3 py-5

            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <div className="space-y-2">
            {visibleMenuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `
                    group
                    relative
                    flex h-14 items-center
                    rounded-xl
                    text-sm font-semibold
                    transition-all duration-200

                    ${collapsed ? "lg:justify-center lg:px-0" : "gap-4 px-4"}

                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-950/20"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    <i
                      className={`
                        bi ${item.icon}
                        shrink-0 text-xl
                        ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-white"
                        }
                      `}
                    />

                    <span
                      className={`
                        whitespace-nowrap
                        transition-opacity duration-200
                        ${collapsed ? "lg:hidden" : ""}
                      `}
                    >
                      {item.label}
                    </span>

                    {/* Tooltip when collapsed */}
                    {collapsed && (
                      <div
                        className="
                          pointer-events-none
                          absolute left-[64px] top-1/2
                          z-[9999]
                          hidden
                          -translate-y-1/2
                          whitespace-nowrap
                          rounded-lg
                          bg-slate-800
                          px-3 py-2
                          text-xs font-medium
                          text-white
                          shadow-xl
                          group-hover:lg:block
                        "
                      >
                        {item.label}

                        <span
                          className="
                            absolute
                            left-[-4px] top-1/2
                            h-2 w-2
                            -translate-y-1/2
                            rotate-45
                            bg-slate-800
                          "
                        />
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* =========================================
            LOGOUT
        ========================================== */}

        <div className="shrink-0 border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Logout" : undefined}
            className={`
              group
              relative
              flex h-14 w-full
              cursor-pointer items-center
              rounded-xl
              text-sm font-semibold
              text-slate-300
              transition-all duration-200

              hover:bg-red-500/10
              hover:text-red-300

              ${collapsed ? "lg:justify-center lg:px-0" : "gap-4 px-4"}
            `}
          >
            <i className="bi bi-box-arrow-right shrink-0 text-xl" />

            <span className={collapsed ? "lg:hidden" : ""}>Logout</span>

            {collapsed && (
              <div
                className="
                  pointer-events-none
                  absolute left-[64px] top-1/2
                  z-[9999]
                  hidden
                  -translate-y-1/2
                  whitespace-nowrap
                  rounded-lg
                  bg-slate-800
                  px-3 py-2
                  text-xs
                  text-white
                  shadow-xl
                  group-hover:lg:block
                "
              >
                Logout
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
