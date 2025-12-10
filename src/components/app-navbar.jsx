import { useEffect, useRef, useState } from "react";
import { 
  Bars3Icon, 
  BellIcon, 
  XMarkIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  FireIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useAuth } from "@/features/auth/utils/auth-context";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const navigation = [
  { name: "Accueil", path: "/home", icon: HomeIcon },
  { name: "Consignation", path: "/consignationlist", icon: ClipboardDocumentListIcon },
  { name: "Permis de feu", path: "/listpermisdefeu", icon: FireIcon },
  { name: "Planifié", path: "/pdfplanified", icon: CalendarDaysIcon },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileButtonRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [profileOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideMenu = mobileMenuRef.current && !mobileMenuRef.current.contains(event.target);
      const isOutsideButton = mobileButtonRef.current && !mobileButtonRef.current.contains(event.target);
      
      if (isOutsideMenu && isOutsideButton) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close dropdown and mobile menu on route change
  useEffect(() => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const userbar = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Utilisateur",
    email: user?.email || "",
    imageUrl:
      user?.user_metadata?.avatar_url ||
      "https://static.vecteezy.com/system/resources/previews/005/544/708/non_2x/profile-icon-design-free-vector.jpg",
  };

  return (
    <nav className="fixed w-full top-0 left-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/home"
              className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded-md"
            >
              <img
                className="h-9 w-auto object-contain rounded bg-white p-1.5"
                src="/suez_logo.png"
                alt="Logo SUEZ"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span 
                className="hidden text-white font-semibold text-lg tracking-tight"
                style={{ display: 'none' }}
              >
                SUEZ
              </span>
            </Link>
          </div>

          {/* Center: Navigation - Hidden below xl */}
          <div className="hidden xl:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={classNames(
                  location.pathname === item.path
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                  "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors duration-150"
                )}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right: Actions - Hidden below xl */}
          <div className="hidden xl:flex items-center gap-2">
            {/* Notification */}
            <button
              type="button"
              className="relative p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              aria-label="Voir les notifications"
            >
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-sky-500 rounded-full"></span>
            </button>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-md p-1.5 hover:bg-slate-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <img
                  className="h-8 w-8 rounded-md object-cover"
                  src={userbar.imageUrl}
                  alt={`Avatar de ${userbar.name}`}
                  onError={(e) => {
                    e.target.src = "https://static.vecteezy.com/system/resources/previews/005/544/708/non_2x/profile-icon-design-free-vector.jpg";
                  }}
                />
                <svg 
                  className={classNames(
                    "h-4 w-4 text-slate-500 transition-transform duration-200",
                    profileOpen ? "rotate-180" : ""
                  )} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg bg-slate-800 border border-slate-700 shadow-xl overflow-hidden">
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-slate-700">
                    <p className="text-sm font-medium text-slate-200 truncate">{userbar.name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{userbar.email}</p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors duration-150"
                    >
                      <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Votre profil
                    </Link>
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700/50 transition-colors duration-150"
                    >
                      <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Right actions */}
          <div className="flex xl:hidden items-center gap-1">
            <button
              type="button"
              className="relative p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-150"
              aria-label="Voir les notifications"
            >
              <BellIcon className="h-5 w-5" aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-sky-500 rounded-full"></span>
            </button>

            <button 
              ref={mobileButtonRef}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <span className="sr-only">{mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="xl:hidden border-t border-slate-800 bg-slate-900">
          {/* Navigation */}
          <div className="px-3 py-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={classNames(
                  location.pathname === item.path
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60",
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium transition-colors duration-150"
                )}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* User section */}
          <div className="border-t border-slate-800 px-3 py-4">
            <div className="flex items-center gap-3 px-3 mb-4">
              <img
                className="h-10 w-10 rounded-md object-cover"
                src={userbar.imageUrl}
                alt={`Avatar de ${userbar.name}`}
                onError={(e) => {
                  e.target.src = "https://static.vecteezy.com/system/resources/previews/005/544/708/non_2x/profile-icon-design-free-vector.jpg";
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{userbar.name}</p>
                <p className="text-xs text-slate-500 truncate">{userbar.email}</p>
              </div>
            </div>

            <div className="space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-base font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors duration-150"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Votre profil
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-base font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors duration-150"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}