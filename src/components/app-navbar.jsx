import { useEffect } from "react";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/features/auth/utils/supabase-client";
import { useAuth } from "@/features/auth/utils/auth-context";

// Fonction utilitaire pour concaténer des classes conditionnelles
function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

// Éléments de navigation (les routes restent inchangées)
const navigation = [
  { name: "Accueil", path: "/home" },
  { name: "Consignation", path: "/consignationlist" },
  { name: "Permis de feu", path: "/listpermisdefeu" },
  { name: "Planifié", path: "/pdfplanified" },


];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fonction de déconnexion utilisant la logique Supabase
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    // Menu automatically closes when route changes due to Disclosure component behavior
  }, [location.pathname]);

  // Données de l'utilisateur avec gestion d'erreur
  const userbar = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Utilisateur",
    email: user?.email || "",
    imageUrl:
      user?.user_metadata?.avatar_url ||
      "https://static.vecteezy.com/system/resources/previews/005/544/708/non_2x/profile-icon-design-free-vector.jpg",
  };

  return (
    <>
      <Disclosure as="nav" className="bg-gray-900 fixed w-full top-0 left-0 z-50 shadow-lg border-b border-gray-700">
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Gauche : Logo & Navigation */}
                <div className="flex items-center">
                  {/* Logo de la marque */}
                  <div className="flex-shrink-0">
                    <Link
                      to="/home"
                      className="flex items-center focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 rounded-md"
                    >
                      <img
                        className="h-10 w-auto object-contain rounded-md bg-white p-1"
                        src="suez_logo.png"
                        alt="Logo SUEZ"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="text-white font-bold text-xl">SUEZ</span>';
                        }}
                      />
                    </Link>
                  </div>
                  {/* Navigation en mode bureau */}
                  <div className="hidden lg:block">
                    <div className="ml-6 xl:ml-10 flex items-baseline space-x-1 xl:space-x-4">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.path}
                          className={classNames(
                            location.pathname === item.path
                              ? "bg-gray-800 text-white shadow-md"
                              : "text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200",
                            "rounded-md px-2 xl:px-3 py-2 text-sm font-medium whitespace-nowrap"
                          )}
                          aria-current={location.pathname === item.path ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Droite : Notifications & Menu Profil */}
                <div className="hidden md:flex items-center space-x-3">
                  <button
                    type="button"
                    className="relative rounded-full bg-gray-800 p-2 text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
                    aria-label="Voir les notifications"
                  >
                    <BellIcon className="h-5 w-5" aria-hidden="true" />
                  </button>

                  <Menu as="div" className="relative">
                    <div>
                      <Menu.Button className="flex items-center rounded-full bg-gray-800 text-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200">
                        <span className="sr-only">Ouvrir le menu utilisateur</span>
                        <img
                          className="h-8 w-8 rounded-full object-cover border-2 border-gray-600"
                          src={userbar.imageUrl}
                          alt={`Avatar de ${userbar.name}`}
                          onError={(e) => {
                            e.target.src = "https://static.vecteezy.com/system/resources/previews/005/544/708/non_2x/profile-icon-design-free-vector.jpg";
                          }}
                        />
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-900 truncate">{userbar.name}</p>
                          <p className="text-sm text-gray-500 truncate">{userbar.email}</p>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/profile"
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                              )}
                            >
                              Votre profil
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleLogout}
                              className={classNames(
                                active ? "bg-gray-100" : "",
                                "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                              )}
                            >
                              Déconnexion
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>

                {/* Bouton du menu mobile */}
                <div className="md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200">
                    <span className="sr-only">{open ? 'Fermer le menu' : 'Ouvrir le menu principal'}</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
            </div>
          </div>

            {/* Menu Mobile avec backdrop */}
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Disclosure.Panel className="md:hidden bg-gray-800 border-t border-gray-700 shadow-lg">
                {/* Navigation mobile */}
                <div className="space-y-1 px-3 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.path}
                      className={classNames(
                        location.pathname === item.path
                          ? "bg-gray-900 text-white shadow-md"
                          : "text-gray-300 hover:bg-gray-700 hover:text-white",
                        "block rounded-md px-3 py-3 text-base font-medium transition-colors duration-200"
                      )}
                      aria-current={location.pathname === item.path ? "page" : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>

                {/* Section utilisateur mobile */}
                <div className="border-t border-gray-700 pt-4 pb-3">
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-600"
                        src={userbar.imageUrl}
                        alt={`Avatar de ${userbar.name}`}
                        onError={(e) => {
                          e.target.src = "https://static.vecteezy.com/system/resources/previews/005/544/708/non_2x/profile-icon-design-free-vector.jpg";
                        }}
                      />
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-base font-medium text-white truncate">{userbar.name}</div>
                      <div className="text-sm font-medium text-gray-400 truncate">{userbar.email}</div>
                    </div>
                    <button
                      type="button"
                      className="ml-auto flex-shrink-0 rounded-full bg-gray-800 p-2 text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors duration-200"
                      aria-label="Voir les notifications"
                    >
                      <BellIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Menu utilisateur mobile */}
                  <div className="mt-3 space-y-1 px-3">
                    <Disclosure.Button
                      as={Link}
                      to="/profile"
                      className="flex items-center rounded-md px-3 py-3 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Votre profil
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={handleLogout}
                      className="flex items-center w-full text-left rounded-md px-3 py-3 text-base font-medium text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </Disclosure.Button>
                  </div>
                </div>
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>

    </>
  );
}
