import { useEffect, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  isAdmin,
  canManageWinesRole,
  canAccessPackages,
} from "../constants/roles";
import { categoriesApi } from "../services/api";
import NotificationBell from "./NotificationBell.jsx";

function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  // The first item is always the "All {Type}" link — clicking the dropdown
  // header navigates straight there.
  const allPath = items[0]?.to;
  return (
    <div
      className="settings-menu"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="settings-menu__toggle"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => allPath && navigate(allPath)}
      >
        {label}
      </button>
      {open && (
        <div className="settings-menu__dropdown">
          {items.map((item) => {
            // NavLink would mark every sibling active because all items share
            // the same pathname; compare the full path + query instead.
            const isActive = location.pathname + location.search === item.to;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={isActive ? "active" : undefined}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function Header() {
  const {
    user,
    realUser,
    isImpersonating,
    session,
    signOut,
    stopImpersonation,
  } = useAuth();
  const navigate = useNavigate();

  // Admin nav links are gated on the REAL user (the admin), not the effective
  // impersonated user, so an admin never loses access to the admin interface
  // while impersonating a non-admin user.
  // Admin nav links are gated on the REAL user (the admin), not the effective
  // impersonated user, so an admin never loses access to the admin interface
  // while impersonating a non-admin user.
  //
  // When not impersonating, realUser is null; fall back to user so menus
  // render normally for the signed-in identity.
  const effectiveIdentity = realUser ?? user;
  const isAdminUser = isAdmin(effectiveIdentity);
  // Editors (and reviewers/admins) may manage categories, so show the
  // Settings menu for them too. The "Admin" menu (Users & Roles, API Health,
  // Subscriptions) is admin-only only.
  const canManageSettings =
    isAdminUser || canManageWinesRole(effectiveIdentity);
  // Wine packages are for content managers and Reviewers (the people who
  // receive and review the wines).
  const canSeePackages = canAccessPackages(effectiveIdentity);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [extrasOpen, setExtrasOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    categoriesApi
      .list()
      .then((cats) => setCategories(Array.isArray(cats) ? cats : []))
      .catch(() => {});
    categoriesApi
      .counts()
      .then((data) => setCounts(data || {}))
      .catch(() => {});
  }, []);

  function navCategories(flag, sortKey) {
    const type = flag.replace("for_", "");
    const countMap = counts[type] || {};
    const uncategorisedCount = counts.uncategorised?.[type] || 0;
    const categoryLinks = categories
      .filter((c) => c[flag])
      .sort((a, b) => (a[sortKey] ?? 9999) - (b[sortKey] ?? 9999))
      .filter((c) => (countMap[c.id] || 0) > 0)
      .map((c) => ({
        label: `${c.name} (${countMap[c.id] || 0})`,
        to:
          "/" +
          flag.replace("for_", "") +
          "s?category=" +
          encodeURIComponent(c.name),
      }));

    // Add Uncategorised as the last item if there are any
    if (uncategorisedCount > 0) {
      categoryLinks.push({
        label: `Uncategorised (${uncategorisedCount})`,
        to: `/${type}s?category=Uncategorised`,
      });
    }

    return categoryLinks;
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  function getDisplayName() {
    if (!session || !user) return null;
    return (
      user.user_name ||
      user.displayName ||
      (user.email ? user.email.split("@")[0] : null)
    );
  }

  const displayName = getDisplayName();
  const initials = getInitials(displayName || user?.email);

  return (
    <header className="site-header">
      {isImpersonating && user && (
        <div className="impersonation-banner" role="status">
          <span className="impersonation-banner__text">
            <strong>Acting as {user.user_name || user.email}</strong>
            <span className="impersonation-banner__sub">
              You are currently operating as this user. Actions will be
              attributed to them.
            </span>
          </span>
          <button
            type="button"
            className="impersonation-banner__stop"
            onClick={async () => {
              try {
                await stopImpersonation();
              } catch (err) {
                // Surface the error but don't crash — the admin can retry.
                console.error("Failed to stop impersonation:", err);
              }
            }}
          >
            Return to Admin
          </button>
        </div>
      )}
      <NavLink className="site-logo" to="/">
        <img
          src="/wine_words.jpg"
          alt="Wine Words"
          style={{ height: "2.5rem", display: "block", borderRadius: ".35rem" }}
        />
        <div>
          <div className="site-header__title">Wine Words - React</div>
          {/* <p className="site-header__subtitle">
            Explore producers, wines and reviews
          </p> */}
        </div>
      </NavLink>
      <nav aria-label="Primary navigation">
        <NavLink end to="/">
          Dashboard
        </NavLink>
        <NavDropdown
          label="Wines"
          items={[
            { label: `All Wines (${counts.totals?.wine || 0})`, to: "/wines" },
            ...navCategories("for_wine", "sort_order_wine"),
          ]}
        />
        <NavDropdown
          label="Reviews"
          items={[
            {
              label: `All Reviews (${counts.totals?.review || 0})`,
              to: "/reviews",
            },
            ...navCategories("for_review", "sort_order_review"),
          ]}
        />
        <NavDropdown
          label="Articles"
          items={[
            {
              label: `All Articles (${counts.totals?.article || 0})`,
              to: "/articles",
            },
            ...navCategories("for_article", "sort_order_article"),
          ]}
        />
        {canSeePackages && <NavLink to="/wine-packages">Wine Packages</NavLink>}
        <div
          className="settings-menu"
          onMouseEnter={() => setExtrasOpen(true)}
          onMouseLeave={() => setExtrasOpen(false)}
        >
          <button
            type="button"
            className="settings-menu__toggle"
            aria-haspopup="true"
            aria-expanded={extrasOpen}
            onClick={() => setExtrasOpen((open) => !open)}
          >
            Extras
          </button>
          {extrasOpen && (
            <div className="settings-menu__dropdown">
              <NavLink to="/finder" onClick={() => setExtrasOpen(false)}>
                Finder
              </NavLink>
              <NavLink to="/quiz" onClick={() => setExtrasOpen(false)}>
                Quiz
              </NavLink>
              <NavLink to="/search" onClick={() => setExtrasOpen(false)}>
                Search
              </NavLink>
            </div>
          )}
        </div>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/subscribe">Subscribe</NavLink>
        {user && <NotificationBell />}
        {canManageSettings && (
          <div
            className="settings-menu"
            onMouseEnter={() => setSettingsOpen(true)}
            onMouseLeave={() => setSettingsOpen(false)}
          >
            <button
              type="button"
              className="settings-menu__toggle"
              aria-haspopup="true"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((open) => !open)}
            >
              Settings
            </button>
            {settingsOpen && (
              <div className="settings-menu__dropdown">
                <NavLink to="/producers" onClick={() => setSettingsOpen(false)}>
                  Producers
                </NavLink>
                <NavLink
                  to="/categories"
                  onClick={() => setSettingsOpen(false)}
                >
                  Categories
                </NavLink>
                <NavLink to="/grapes" onClick={() => setSettingsOpen(false)}>
                  Grapes
                </NavLink>
                <NavLink to="/countries" onClick={() => setSettingsOpen(false)}>
                  Countries
                </NavLink>
                <NavLink to="/regions" onClick={() => setSettingsOpen(false)}>
                  Regions
                </NavLink>
              </div>
            )}
          </div>
        )}
        {isAdminUser && (
          <div
            className="settings-menu"
            onMouseEnter={() => setAdminOpen(true)}
            onMouseLeave={() => setAdminOpen(false)}
          >
            <button
              type="button"
              className="settings-menu__toggle"
              aria-haspopup="true"
              aria-expanded={adminOpen}
              onClick={() => setAdminOpen((open) => !open)}
            >
              Admin
            </button>
            {adminOpen && (
              <div className="settings-menu__dropdown">
                <NavLink to="/users" onClick={() => setAdminOpen(false)}>
                  Users &amp; Roles
                </NavLink>
                <NavLink
                  to="/admin/api-health"
                  onClick={() => setAdminOpen(false)}
                >
                  API Health
                </NavLink>
                <NavLink
                  to="/subscriptions"
                  onClick={() => setAdminOpen(false)}
                >
                  Subscriptions
                </NavLink>
                <NavLink to="/admin/logs" onClick={() => setAdminOpen(false)}>
                  Logs
                </NavLink>
                <NavLink
                  to="/admin/configuration"
                  onClick={() => setAdminOpen(false)}
                >
                  Configuration
                </NavLink>
              </div>
            )}
          </div>
        )}

        {user ? (
          <div className="site-header__user">
            <span className="site-header__avatar" aria-hidden="true">
              {initials}
            </span>
            <div className="site-header__user-info">
              <span className="site-header__user-name">{displayName}</span>
              {user.roles && user.roles.length > 0 && (
                <span className="site-header__user-roles" aria-label="Roles">
                  {user.roles.map((role) => (
                    <span
                      key={role}
                      className={`site-header__user-role site-header__user-role--${role.toLowerCase()}`}
                    >
                      {role}
                    </span>
                  ))}
                </span>
              )}
              {user.subscription && (
                <span className="site-header__user-subscription">
                  {user.subscription.name}
                </span>
              )}
              {user.email && (
                <span className="site-header__user-email">{user.email}</span>
              )}
            </div>
            <NavLink className="site-header__auth" to="/account">
              Account
            </NavLink>
            <button
              className="site-header__auth"
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </button>
          </div>
        ) : (
          <NavLink className="site-header__auth" to="/login">
            Login / Sign up
          </NavLink>
        )}
      </nav>
    </header>
  );
}

export default Header;
