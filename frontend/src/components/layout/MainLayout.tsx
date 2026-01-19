import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  Home,
  Calendar,
  Users,
  Shield,
  LogOut,
  Menu,
  X,
  GitBranch,
} from 'lucide-react';
import { useState } from 'react';
import { UserAvatar } from '../ui/UserAvatar';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Eventos', href: '/events', icon: Calendar },
    { name: 'Clanes', href: '/clanes', icon: Shield },
  ];

  if (user?.role === 'ADMIN' || user?.role === 'CLAN_LEADER') {
    navigation.push({ name: 'Usuarios', href: '/users', icon: Users });
  }

  if (user?.role === 'ADMIN') {
    navigation.push({
      name: 'Solicitudes',
      href: '/users/requests',
      icon: GitBranch,
    });
  }

  return (
    <div className="min-h-screen bg-military-50">
      {/* Navbar */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-military-900">
                  Arma Events
                </span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-military-500 hover:border-primary-500 hover:text-military-700 transition-colors"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Usuario info - Desktop */}
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
              {user && (
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} size="md" showBorder={true} />
                  <div className="text-right">
                    <p className="text-sm font-medium text-military-900">
                      {user.nickname}
                    </p>
                    <p className="text-xs text-military-600">
                      {user.clan?.tag && `${user.clan.tag} `}
                      {user.role === 'ADMIN'
                        ? 'Admin'
                        : user.role === 'CLAN_LEADER'
                        ? 'Líder'
                        : 'Miembro'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline btn-sm flex items-center ml-2"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Salir
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-military-400 hover:text-military-500 hover:bg-military-100"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-2 text-base font-medium text-military-500 hover:bg-military-50 hover:text-military-700"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-military-200">
              {user && (
                <div className="px-4 flex items-center gap-3 mb-3">
                  <UserAvatar user={user} size="lg" showBorder={true} />
                  <div>
                    <p className="text-base font-medium text-military-900">
                      {user.nickname}
                    </p>
                    <p className="text-sm text-military-500">{user.email}</p>
                    <p className="text-xs text-military-600">
                      {user.clan?.tag && `${user.clan.tag} `}
                      {user.role === 'ADMIN'
                        ? 'Admin'
                        : user.role === 'CLAN_LEADER'
                        ? 'Líder'
                        : 'Miembro'}
                    </p>
                  </div>
                </div>
              )}
              <div className="px-4">
                <button
                  onClick={handleLogout}
                  className="w-full btn btn-outline flex items-center justify-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}