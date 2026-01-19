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
    { path: '/events', label: 'Eventos', icon: Calendar },
    { path: '/clanes', label: 'Clanes', icon: Shield },
    ...(user?.role === 'ADMIN'
      ? [{ path: '/users', label: 'Usuarios', icon: Users }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-military-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-military-200 sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-military-900 hidden sm:inline">
                Arma Platform
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-military-700 hover:bg-military-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* User menu - Desktop */}
            {user && (
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-military-100 transition-colors"
                >
                  <UserAvatar user={user} size="md" showBorder={true} />
                  <div className="text-left">
                    <p className="font-medium text-military-900">{user.nickname}</p>
                    <p className="text-xs text-military-600">
                      {user.role === 'ADMIN'
                        ? 'Administrador'
                        : user.role === 'CLAN_LEADER'
                        ? 'Líder de Clan'
                        : 'Usuario'}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-military-600" />
                </button>

                {/* Dropdown menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-military-200 py-2 z-50">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 px-4 py-2 hover:bg-military-50 text-military-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        Mi Perfil
                      </Link>
                      <div className="border-t border-military-200 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-50 text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        Salir
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-military-700 hover:bg-military-50 rounded-lg"
            >
              {showMobileMenu ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-military-200 py-4">
            {/* User info - Mobile */}
            {user && (
              <div className="px-4 mb-4">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-military-200">
                  <UserAvatar user={user} size="lg" showBorder={true} />
                  <div>
                    <p className="font-medium text-military-900">{user.nickname}</p>
                    <p className="text-sm text-military-600">
                      {user.role === 'ADMIN'
                        ? 'Administrador'
                        : user.role === 'CLAN_LEADER'
                        ? 'Líder de Clan'
                        : 'Usuario'}
                    </p>
                    {user.clan && (
                      <p className="text-xs text-military-500">
                        {user.clan.tag && `${user.clan.tag} `}
                        {user.clan.name}
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-military-50 text-military-700 mb-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <UserIcon className="h-5 w-5" />
                  Mi Perfil
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
                >
                  <LogOut className="h-5 w-5" />
                  Salir
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
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-military-700 hover:bg-military-50'
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
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}