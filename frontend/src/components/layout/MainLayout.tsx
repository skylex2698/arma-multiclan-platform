import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Shield,
  Calendar,
  Users,
  Home,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Footer } from './Footer';
import { APP_CONFIG } from '../../config/app.config';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/events', label: 'Operaciones', icon: Calendar },
    { path: '/clanes', label: 'Clanes', icon: Shield },
    // Mostrar Personal tanto para ADMIN como para CLAN_LEADER
    ...(user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER'
      ? [{ path: '/users', label: 'Personal', icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-military-50 dark:bg-gray-900 tactical-grid">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-military-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary-600 dark:text-tactical-500" />
                <div className="absolute inset-0 bg-primary-600 dark:bg-tactical-500 opacity-20 blur-lg"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold text-military-900 dark:text-gray-100">
                  {APP_CONFIG.shortName}
                </span>
                <p className="text-xs text-military-600 dark:text-gray-400 -mt-1">
                  {APP_CONFIG.name}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                      isActive(link.path)
                        ? 'bg-primary-100 dark:bg-tactical-900 text-primary-700 dark:text-tactical-400 font-medium shadow-sm'
                        : 'text-military-700 dark:text-gray-300 hover:bg-military-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side - Theme toggle + User menu */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User menu - Desktop */}
              {user && (
                <div className="hidden lg:block relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-military-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <UserAvatar user={user} size="md" showBorder={true} />
                    <div className="text-left">
                      <p className="font-medium text-military-900 dark:text-gray-100">
                        {user.nickname}
                      </p>
                      <p className="text-xs text-military-600 dark:text-gray-400">
                        {user.role === 'ADMIN'
                          ? 'Administrador'
                          : user.role === 'CLAN_LEADER'
                          ? 'Líder de Clan'
                          : 'Operador'}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-military-600 dark:text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-military-200 dark:border-gray-700 py-2 z-50">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2 px-4 py-2 hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <UserIcon className="h-4 w-4" />
                          Mi Perfil
                        </Link>
                        <div className="border-t border-military-200 dark:border-gray-700 my-2"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 text-military-700 dark:text-gray-300 hover:bg-military-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {showMobileMenu ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-military-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-800">
            {/* User info - Mobile */}
            {user && (
              <div className="px-4 mb-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-military-200 dark:border-gray-700">
                  <UserAvatar user={user} size="lg" showBorder={true} />
                  <div>
                    <p className="font-medium text-military-900 dark:text-gray-100">
                      {user.nickname}
                    </p>
                    <p className="text-sm text-military-600 dark:text-gray-400">
                      {user.role === 'ADMIN'
                        ? 'Administrador'
                        : user.role === 'CLAN_LEADER'
                        ? 'Líder de Clan'
                        : 'Operador'}
                    </p>
                    {user.clan && (
                      <p className="text-xs text-military-500 dark:text-gray-500">
                        {user.clan.tag && `${user.clan.tag} `}
                        {user.clan.name}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 mb-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <UserIcon className="h-5 w-5" />
                  Mi Perfil
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </button>
              </div>
            )}

            {/* Navigation - Mobile */}
            <nav className="space-y-1 px-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary-100 dark:bg-tactical-900 text-primary-700 dark:text-tactical-400 font-medium'
                        : 'text-military-700 dark:text-gray-300 hover:bg-military-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 flex-1">{children}</main>

      {/* Footer */}
      <Footer />
    </div>
  );
}