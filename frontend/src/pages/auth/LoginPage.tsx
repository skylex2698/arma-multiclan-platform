import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { Shield, Mail, Lock, LogIn } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { DiscordLoginButton } from '../../components/auth/DiscordLoginButton';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({ email, password });
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || 'Error al iniciar sesión'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Shield className="h-20 w-20 text-accent-400" />
              <div className="absolute inset-0 bg-accent-400 opacity-20 blur-2xl"></div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {APP_CONFIG.shortName}
          </h1>
          <p className="text-military-200 dark:text-gray-400">
            {APP_CONFIG.name}
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 border border-military-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-military-900 dark:text-gray-100 mb-6">
            Iniciar Sesión
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-military-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-military-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-military-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-military-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-military-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-military-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="h-5 w-5" />
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Separador */}
          <div className="mt-6 mb-6 flex items-center">
            <div className="flex-1 border-t border-military-200 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-military-500 dark:text-gray-400">o</span>
            <div className="flex-1 border-t border-military-200 dark:border-gray-600"></div>
          </div>

          {/* Discord Login */}
          <DiscordLoginButton />

          <div className="mt-6 text-center text-sm text-military-600">
            ¿No tienes cuenta?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Regístrate aquí
            </Link>
          </div>

          {/* Usuarios de prueba */}
          <div className="mt-6 pt-6 border-t border-military-200">
            <p className="text-xs text-military-600 mb-2">Usuarios de prueba:</p>
            <div className="space-y-1 text-xs text-military-500">
              <p>
                <strong>Admin:</strong> admin@arma.com / Admin123!
              </p>
              <p>
                <strong>Líder:</strong> leader@arma.com / Leader123!
              </p>
              <p>
                <strong>Usuario:</strong> user@arma.com / User123!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}