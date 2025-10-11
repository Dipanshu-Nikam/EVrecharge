// src/components/Header.jsx
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthProvider";

// Spring Energy palette (from image)
// #89F336, #FFFC30, #4FE0CB, #00BF33
const COLORS = {
    lime: "#89F336",
    lemon: "#FFFC30",
    aqua: "#4FE0CB",
    green: "#00BF33",

    // Theming neutrals to keep contrast consistent
    bg: "#0f1a12",
    bgSoft: "#132416",
    slate: "#17321f",
    border: "rgba(0,191,51,0.45)",
    text: "#eaffea",
    textMuted: "rgba(234,255,234,0.72)",

    // Alert tones kept similar but aligned
    dangerBg: "#3a2a2a",
    dangerBorder: "#a04b4b",
    danger: "#fda4af",
};

// Icons
const BellIcon = ({ hasNotifications, ...props }) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        {hasNotifications && (
            <circle cx="18" cy="6" r="3" fill={COLORS.green} stroke={COLORS.aqua} strokeWidth="1" />
        )}
    </svg>
);

const MenuIcon = (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

const LogoutIcon = (props) => (
    <svg {...props} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
);

// Simple EV charger logo icon (inline SVG)
const ChargerLogo = (props) => (
    <svg {...props} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect x="6" y="6" width="12" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M12 10l-2 6h3l-1 6 6-9h-3l2-3h-5z" fill="currentColor" />
        <path d="M18 10c2 0 4 1.5 4 4v6a3 3 0 003 3h1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="22" r="1.5" fill="currentColor" />
    </svg>
);

// User Avatar
const UserAvatar = ({ user, size = 32 }) => {
    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email?.[0]?.toUpperCase() || "A";

    const avatarStyles = {
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        overflow: "hidden",
        border: `2px solid ${COLORS.border}`,
        transition: "all 0.2s ease",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.slate,
        color: COLORS.text,
    };

    const imageStyles = { width: "100%", height: "100%", objectFit: "cover" };

    const defaultStyles = {
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 100%)`,
        color: "#0b0b0b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: `${size * 0.4}px`,
        fontWeight: "600",
    };

    return (
        <div style={avatarStyles} className="user-avatar">
            {user?.avatar ? (
                <img src={user.avatar} alt={user.name || user.email} style={imageStyles} />
            ) : (
                <div style={defaultStyles}>{initials}</div>
            )}
        </div>
    );
};

export default function Header({ onMenuToggle, showMenuButton, isMobile }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const role = useMemo(() => {
        if (!user) return null;
        const userRole =
            user.role ||
            user.customClaims?.role ||
            (user.isOwner ? "owner" : null) ||
            (user.isAdmin ? "admin" : null) ||
            "user";
        return String(userRole).toLowerCase();
    }, [user]);

    const isOwner = user && (role === "owner" || user?.isOwner);
    const isAdmin = user && (role === "admin" || user?.isAdmin);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/", { replace: true });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const getNavItemStyle = (path, isSpecial = false) => {
        const isActive = location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

        const baseStyle = {
            textDecoration: "none",
            padding: "8px 14px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s ease",
            position: "relative",
            display: "inline-block",
            color: COLORS.textMuted,
            border: `1px solid transparent`,
        };

        if (isSpecial === "owner") {
            return {
                ...baseStyle,
                color: COLORS.lime,
                background: isActive ? "rgba(137,243,54,0.12)" : "transparent",
                fontWeight: 600,
                border: isActive ? `1px solid ${COLORS.lime}` : "1px solid transparent",
                transform: isActive ? "translateY(-1px)" : "none",
                boxShadow: isActive ? `0 6px 18px rgba(137,243,54,0.18)` : "none",
            };
        }

        if (isSpecial === "admin") {
            return {
                ...baseStyle,
                color: COLORS.aqua,
                background: isActive ? "rgba(79,224,203,0.12)" : "transparent",
                fontWeight: 600,
                border: isActive ? `1px solid ${COLORS.aqua}` : "1px solid transparent",
                transform: isActive ? "translateY(-1px)" : "none",
                boxShadow: isActive ? `0 6px 18px rgba(79,224,203,0.18)` : "none",
            };
        }

        return {
            ...baseStyle,
            color: isActive ? COLORS.text : COLORS.textMuted,
            background: isActive ? COLORS.bgSoft : "transparent",
            border: isActive ? `1px solid ${COLORS.border}` : "1px solid transparent",
            fontWeight: isActive ? 600 : 500,
            transform: isActive ? "translateY(-1px)" : "none",
            boxShadow: isActive ? "0 6px 18px rgba(0,0,0,0.25)" : "none",
        };
    };

    const headerStyles = {
        position: "sticky",
        top: 0,
        zIndex: 1000,
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.slate} 100%)`,
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${COLORS.border}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: COLORS.text,
    };

    const containerStyles = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "12px 24px",
        display: "grid",
        gridTemplateColumns: showMenuButton ? "auto auto 1fr auto" : "auto 1fr auto",
        alignItems: "center",
        gap: "20px",
        height: "64px",
    };

    const brandStyles = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
        color: "inherit",
        fontWeight: 800,
        fontSize: "20px",
        transition: "all 0.2s ease",
    };

    const brandIconStyles = {
        width: 24,
        height: 24,
        color: COLORS.lime,
        filter: "drop-shadow(0 2px 6px rgba(137,243,54,0.35))",
    };

    const brandNameStyles = {
        color: "#ffffff",                 // solid white wordmark
        WebkitTextFillColor: "unset",     // ensure gradient text clip doesn't override
        WebkitBackgroundClip: "unset",
        display: isMobile ? "none" : "block",
        fontWeight: 800,
    };
    const navigationStyles = {
        display: isMobile ? "none" : "flex",
        gap: "8px",
        justifySelf: "center",
        alignItems: "center",
    };

    const actionsStyles = { display: "flex", alignItems: "center", gap: "12px" };

    const profileBtnStyles = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        textDecoration: "none",
        color: COLORS.text,
        padding: "6px 12px",
        borderRadius: "10px",
        transition: "all 0.2s ease",
        border: `1px solid ${COLORS.border}`,
        background: COLORS.bgSoft,
        minWidth: isMobile ? "auto" : "120px",
        cursor: "pointer",
    };

    const profileTextStyles = {
        fontSize: "14px",
        fontWeight: "500",
        color: COLORS.text,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        maxWidth: "80px",
        display: isMobile ? "none" : "block",
    };

    const authGroupStyles = { display: "flex", gap: "12px", alignItems: "center" };

    const loginLinkStyles = {
        textDecoration: "none",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: "500",
        color: COLORS.text,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "10px",
        transition: "all 0.2s ease",
        background: COLORS.bgSoft,
    };

    const signupLinkStyles = {
        textDecoration: "none",
        padding: "8px 16px",
        fontSize: "14px",
        fontWeight: 600,
        color: "#0a0a0a",
        background: `linear-gradient(135deg, ${COLORS.lime} 0%, ${COLORS.aqua} 60%)`,
        borderRadius: "10px",
        transition: "all 0.2s ease",
        border: "1px solid transparent",
        boxShadow: "0 6px 18px rgba(79,224,203,0.35)",
    };

    const logoutBtnStyles = {
        background: COLORS.dangerBg,
        border: `1px solid ${COLORS.dangerBorder}`,
        borderRadius: "10px",
        padding: "8px",
        color: COLORS.danger,
        cursor: "pointer",
        transition: "all 0.2s ease",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    };

    const notifyBtnStyles = {
        background: COLORS.bgSoft,
        border: `1px solid ${COLORS.border}`,
        borderRadius: "10px",
        padding: "8px",
        color: COLORS.textMuted,
        cursor: "pointer",
        transition: "all 0.2s ease",
        textDecoration: "none",
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
    };

    return (
        <header style={headerStyles}>
            <div style={containerStyles}>
                {showMenuButton && (
                    <button
                        style={{
                            background: COLORS.bgSoft,
                            border: `1px solid ${COLORS.border}`,
                            borderRadius: "10px",
                            padding: "8px",
                            color: COLORS.text,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                        onClick={onMenuToggle}
                        aria-label="Toggle menu"
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = COLORS.slate;
                            e.currentTarget.style.borderColor = COLORS.border;
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = COLORS.bgSoft;
                            e.currentTarget.style.borderColor = COLORS.border;
                        }}
                    >
                        <MenuIcon style={{ width: "20px", height: "20px" }} />
                    </button>
                )}

                <Link
                    to="/"
                    style={brandStyles}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = "scale(1.04)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                    }}
                >
                    <ChargerLogo style={brandIconStyles} />
                    <span style={brandNameStyles}>EV Station</span>
                </Link>

                <nav style={navigationStyles}>
                    <NavLink to="/" style={getNavItemStyle("/")}>Home</NavLink>
                    <NavLink to="/planner" style={getNavItemStyle("/planner")}>Trip Planner</NavLink>
                    <NavLink to="/search" style={getNavItemStyle("/search")}>Search Stations</NavLink>
                    <NavLink to="/about" style={getNavItemStyle("/about")}>About</NavLink>

                    {isOwner && (
                        <NavLink to="/owner/dashboard" style={getNavItemStyle("/owner/dashboard", "owner")}>
                            Owner Portal
                        </NavLink>
                    )}

                    {isAdmin && (
                        <NavLink to="/admin/dashboard" style={getNavItemStyle("/admin/dashboard", "admin")}>
                            Admin Panel
                        </NavLink>
                    )}
                </nav>

                <div style={actionsStyles}>
                    {user ? (
                        <>
                            <Link
                                to="/notifications"
                                style={notifyBtnStyles}
                                title="Notifications"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = COLORS.slate;
                                    e.currentTarget.style.borderColor = COLORS.aqua;
                                    e.currentTarget.style.color = COLORS.lime;
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = COLORS.bgSoft;
                                    e.currentTarget.style.borderColor = COLORS.border;
                                    e.currentTarget.style.color = COLORS.textMuted;
                                    e.currentTarget.style.transform = "translateY(0px)";
                                }}
                            >
                                <BellIcon hasNotifications={false} style={{ width: "20px", height: "20px" }} />
                            </Link>

                            <button
                                style={logoutBtnStyles}
                                onClick={handleLogout}
                                title="Logout"
                                aria-label="Logout"
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = "#4a2f2f";
                                    e.currentTarget.style.borderColor = "#ef4444";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = COLORS.dangerBg;
                                    e.currentTarget.style.borderColor = COLORS.dangerBorder;
                                    e.currentTarget.style.transform = "translateY(0px)";
                                }}
                            >
                                <LogoutIcon style={{ width: "20px", height: "20px" }} />
                            </button>

                            <Link
                                to="/profile"
                                style={profileBtnStyles}
                                title={`${user.name || user.email} - View Profile`}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = COLORS.slate;
                                    e.currentTarget.style.borderColor = COLORS.aqua;
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                    e.currentTarget.style.boxShadow = "0 8px 22px rgba(0,0,0,0.35)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = COLORS.bgSoft;
                                    e.currentTarget.style.borderColor = COLORS.border;
                                    e.currentTarget.style.transform = "translateY(0px)";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <UserAvatar user={user} size={32} />
                                <span style={profileTextStyles}>
                                    {user.name || user.email?.split("@")[0] || "User"}
                                </span>
                            </Link>
                        </>
                    ) : (
                        <div style={authGroupStyles}>
                            <Link
                                to="/auth/login"
                                style={loginLinkStyles}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = COLORS.slate;
                                    e.currentTarget.style.borderColor = COLORS.aqua;
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = COLORS.bgSoft;
                                    e.currentTarget.style.borderColor = COLORS.border;
                                    e.currentTarget.style.transform = "translateY(0px)";
                                }}
                            >
                                Login
                            </Link>
                            <Link
                                to="/auth/register"
                                style={signupLinkStyles}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.transform = "translateY(-2px) scale(1.04)";
                                    e.currentTarget.style.boxShadow = "0 10px 28px rgba(79,224,203,0.5)";
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(79,224,203,0.35)";
                                }}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
