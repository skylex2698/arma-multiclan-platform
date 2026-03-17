import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  Shield,
  Calendar,
  Users,
  Home,
  Gamepad2,
  Menu,
  X,
  LogOut,
  ChevronDown,
  User as UserIcon,
  AlertTriangle,
  CircleHelp,
  Lightbulb,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Logo } from '../ui/Logo';
import { Footer } from './Footer';
import { HelpMenu } from './HelpMenu';
import { APP_CONFIG } from '../../config/app.config';
import { getRoleDisplayName, hasPermission, PERMISSIONS } from '../../utils/permissions';
import { FeedbackModal } from '../feedback/FeedbackModal';
import type { FeedbackType } from '../../types';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [feedbackModalType, setFeedbackModalType] = useState<FeedbackType>('BUG');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const canManageFeedback = hasPermission(user, PERMISSIONS.FEEDBACK_MANAGE);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const openFeedbackModal = (type: FeedbackType) => {
    setFeedbackModalType(type);
    setShowHelpMenu(false);
    setShowMobileMenu(false);
    setShowFeedbackModal(true);
  };

  useEffect(() => {
    if (!showUserMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [showUserMenu]);

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/events', label: 'Operaciones', icon: Calendar },
    { path: '/clanes', label: 'Clanes', icon: Shield },
    ...(hasPermission(user, PERMISSIONS.GAME_MANAGE)
      ? [{ path: '/games', label: 'Juegos', icon: Gamepad2 }]
      : []),
    ...(hasPermission(user, PERMISSIONS.USER_VIEW)
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
              <Logo size="lg" withGlow />
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
              <HelpMenu
                isOpen={showHelpMenu}
                onToggle={() => {
                  setShowUserMenu(false);
                  setShowHelpMenu((current) => !current);
                }}
                onClose={() => setShowHelpMenu(false)}
                onOpenProblemReport={() => openFeedbackModal('BUG')}
                onOpenSuggestion={() => openFeedbackModal('SUGGESTION')}
              />

              {/* User menu - Desktop */}
              {user && (
                <div
                  ref={userMenuRef}
                  className="relative hidden h-11 items-center lg:flex"
                >
                  <button
                    onClick={() => {
                      setShowHelpMenu(false);
                      setShowUserMenu(!showUserMenu);
                    }}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-military-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <UserAvatar user={user} size="md" showBorder={true} />
                    <div className="text-left">
                      <p className="font-medium text-military-900 dark:text-gray-100">
                        {user.nickname}
                      </p>
                      <p className="text-xs text-military-600 dark:text-gray-400">
                        {getRoleDisplayName(user)}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-military-600 dark:text-gray-400" />
                  </button>

                  {/* Dropdown menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-[360px] overflow-hidden rounded-lg border border-military-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
                      <div className="border-b border-military-200 px-4 py-3 dark:border-gray-700">
                        <p className="text-lg font-medium text-military-950 dark:text-gray-100">
                          {user.nickname}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-military-600 dark:text-gray-400">
                          {getRoleDisplayName(user)}
                        </p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-4 py-4 hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-military-100 text-military-700 dark:bg-gray-700 dark:text-gray-200">
                          <UserIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-lg font-medium text-military-900 dark:text-gray-100">
                            Mi Perfil
                          </p>
                          <p className="mt-1 text-sm leading-6 text-military-600 dark:text-gray-400">
                            Gestiona tus datos personales, contraseña y configuración.
                          </p>
                        </div>
                      </Link>
                      {canManageFeedback && (
                        <Link
                          to="/feedback"
                          className="flex items-center gap-3 px-4 py-4 hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-military-100 text-military-700 dark:bg-gray-700 dark:text-gray-200">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-lg font-medium text-military-900 dark:text-gray-100">
                              Bandeja de feedback
                            </p>
                            <p className="mt-1 text-sm leading-6 text-military-600 dark:text-gray-400">
                              Revisa incidencias y mejoras enviadas por los usuarios.
                            </p>
                          </div>
                        </Link>
                      )}
                      <div className="border-t border-military-200 dark:border-gray-700 my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300">
                          <LogOut className="h-4 w-4" />
                        </span>
                        <div className="text-left">
                          <p className="text-lg font-medium">Cerrar sesión</p>
                          <p className="mt-1 text-sm leading-6 text-red-500 dark:text-red-300">
                            Finaliza la sesión actual en este navegador.
                          </p>
                        </div>
                      </button>
                    </div>
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
                      {getRoleDisplayName(user)}
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
                {canManageFeedback && (
                  <Link
                    to="/feedback"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 mb-2"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <AlertTriangle className="h-5 w-5" />
                    Bandeja feedback
                  </Link>
                )}
                <Link
                  to="/help/manual"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 mb-2"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <CircleHelp className="h-5 w-5" />
                  Manual rapido
                </Link>
                <button
                  type="button"
                  onClick={() => openFeedbackModal('BUG')}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 mb-2"
                >
                  <AlertTriangle className="h-5 w-5" />
                  Informar de un problema
                </button>
                <button
                  type="button"
                  onClick={() => openFeedbackModal('SUGGESTION')}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-military-50 dark:hover:bg-gray-700 text-military-700 dark:text-gray-300 mb-2"
                >
                  <Lightbulb className="h-5 w-5" />
                  Proponer una mejora
                </button>

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
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        initialType={feedbackModalType}
      />
    </div>
  );
}
