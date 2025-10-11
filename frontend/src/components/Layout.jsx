// src/components/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import { useAuth } from "../context/AuthProvider";
import "../styles/layout.css";

// Spring Energy palette
// #89F336 (lime), #FFFC30 (lemon), #4FE0CB (aqua), #00BF33 (green)
const COLORS = {
  lime: "#89F336",
  lemon: "#FFFC30",
  aqua: "#4FE0CB",
  green: "#00BF33",

  // Theme neutrals, tuned for contrast
  bg: "#0f1a12",
  surface: "#ad9408ff",
  surface2: "#edba14ff",
  panel: "#e8c92aff",
  card: "#162b1b",
  border: "rgba(0,191,51,0.45)",
  text: "#eaffea",
  textMuted: "rgba(234,255,234,0.72)",
  shadow: "rgba(0,0,0,0.45)",
};

// Single full-page background image (update path/file)
const BG_IMAGE = "/src/assets/icons/backgroundimages/app-bg.jpg";

export default function Layout({ withSidebar, withOwnerSidebar, withAdminSidebar }) {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  const role = (user?.role || user?.type || user?.customClaims?.role || "user").toLowerCase();
  const isOwner = role === "owner" || user?.isOwner;
  const isAdmin = role === "admin" || user?.isAdmin;

  const currentPath = location.pathname;
  const isOwnerRoute = currentPath.startsWith("/owner");
  const isAdminRoute = currentPath.startsWith("/admin");
  const isUserDashboard = ["/dashboard", "/planner", "/profile", "/bookings", "/favorites"].some(
    (path) => currentPath.startsWith(path)
  );

  const getSidebarType = () => {
    if (withAdminSidebar || (isAdminRoute && isAdmin)) return "admin";
    if (withOwnerSidebar || (isOwnerRoute && isOwner)) return "owner";
    if (withSidebar || isUserDashboard) return "user";
    if (isAdmin && isAdminRoute) return "admin";
    if (isOwner && isOwnerRoute) return "owner";
    if (user && isUserDashboard) return "user";
    return null;
  };

  const sidebarType = getSidebarType();
  const showSidebar = sidebarType !== null;
  const showBottomNav = isMobile && showSidebar;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const onMenuToggle = () => { };

  return (
    <div className="layout-container layout-bg-single">
      <header className="layout-header">
        <Header
          isMobile={isMobile}
          showMenuButton={isMobile || !showSidebar ? false : true}
          onMenuToggle={onMenuToggle}
        />
      </header>

      <div
        className={`layout-main ${showSidebar && !isMobile ? "with-sidebar" : ""} ${sidebarType || ""}`}
      >
        {showSidebar && !isMobile && (
          <aside className={`layout-sidebar ${sidebarType}`}>
            <Sidebar type={sidebarType} user={user} role={role} />
          </aside>
        )}

        <main className={`layout-content ${showBottomNav ? "with-bottom-nav" : ""}`}>
          <div className="layout-content-inner">
            <Outlet />
          </div>
        </main>
      </div>

      {showBottomNav && (
        <nav className="layout-bottom-nav">
          <MobileBottomNav type={sidebarType} user={user} role={role} currentPath={currentPath} />
        </nav>
      )}

      {(!isMobile || !showSidebar) && <Footer />}

      {/* Spring Energy theme styles + single full-screen background image */}
      <style jsx>{`
        .layout-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          position: relative;
          color: ${COLORS.text};
        }

        /* Single full-bleed background image (fixed to viewport) */
        .layout-bg-single::before {
          content: "";
          position: fixed;
          inset: 0;
          background-image: url("${BG_IMAGE}");
          background-size: cover;
          background-repeat: no-repeat;
          background-position: center center;
          transform: translateZ(0);
          z-index: -2; /* far behind content */
        }

        /* Gradient overlay for readability and theme */
        .layout-bg-single::after {
          content: "";
          position: fixed;
          inset: 0;
          background:
            radial-gradient(800px 300px at 10% -10%, rgba(79, 224, 203, 0.10), transparent 60%),
            radial-gradient(900px 360px at 110% 10%, rgba(255, 252, 48, 0.10), transparent 60%),
            linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.surface} 100%);
          opacity: 0.92;        /* adjust 0.85–0.95 as needed */
          mix-blend-mode: multiply;
          z-index: -1;
        }

        /* Content sits above bg and overlay */
        .layout-header,
        .layout-main,
        .layout-bottom-nav,
        .layout-content {
          position: relative;
          z-index: 1;
        }

        .layout-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: transparent;
          border-bottom: 1px solid transparent;
        }

        .layout-main {
          flex: 1;
          display: flex;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 16px;
        }
        .layout-main.with-sidebar { gap: 24px; }
        .layout-main.admin { max-width: 1600px; }

        .layout-sidebar {
          width: 260px;
          background: linear-gradient(180deg, ${COLORS.panel}, ${COLORS.surface2});
          border-radius: 14px;
          box-shadow: 0 10px 24px ${COLORS.shadow};
          position: sticky;
          top: 80px;
          height: fit-content;
          max-height: calc(100vh - 120px);
          overflow-y: auto;
          border: 1px solid ${COLORS.border};
          color: ${COLORS.text};
        }
        .layout-sidebar.admin {
          width: 280px;
          background: linear-gradient(135deg, ${COLORS.green} 0%, ${COLORS.aqua} 100%);
          color: #0b0b0b;
          border: 1px solid rgba(0, 0, 0, 0.12);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
        }
        .layout-sidebar.owner {
          background: linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 65%, ${COLORS.green} 100%);
          color: #0b1a0b;
          border: 1px solid rgba(0, 191, 51, 0.35);
        }

        .layout-content {
          flex: 1;
          min-width: 0;
          background: ${COLORS.card};
          border-radius: 14px;
          box-shadow: 0 10px 24px ${COLORS.shadow};
          overflow: hidden;
          border: 1px solid ${COLORS.border};
          color: ${COLORS.text};
        }
        .layout-content.with-bottom-nav { margin-bottom: 70px; }
        .layout-content-inner {
          padding: 24px;
          min-height: calc(100vh - 200px);
        }

        .layout-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: linear-gradient(180deg, ${COLORS.surface2}, ${COLORS.panel});
          border-top: 1px solid ${COLORS.border};
          box-shadow: 0 -10px 24px ${COLORS.shadow};
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 8px 16px;
          color: ${COLORS.text};
        }

        /* Focus rings */
        a:focus, button:focus, [tabindex]:focus {
          outline: 2px solid ${COLORS.aqua};
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(255, 252, 48, 0.18);
        }

        .hr-muted {
          height: 1px;
          border: none;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.14), transparent);
          margin: 8px 0;
        }

        @media (max-width: 768px) {
          .layout-main {
            padding: 0;
            flex-direction: column;
          }
          .layout-content {
            border-radius: 0;
            box-shadow: none;
            border: none;
            background: ${COLORS.surface};
          }
          .layout-content-inner {
            padding: 16px;
            min-height: calc(100vh - 140px);
          }
          .layout-content.with-bottom-nav .layout-content-inner {
            min-height: calc(100vh - 210px);
            padding-bottom: 80px;
          }
        }
      `}</style>
    </div>
  );
}
