import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useClans } from '../../hooks/useClans';
import { APP_CONFIG } from '../../config/app.config';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Logo } from '../../components/ui/Logo';

export default function RegisterPage() {
  const { data: clansData, isLoading: loadingClans } = useClans();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [clanId, setClanId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (nickname.length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      return;
    }

    if (!clanId) {
      setError('Debes seleccionar un clan');
      return;
    }

    setLoading(true);

    try {
      await authService.register({
        email,
        password,
        nickname,
        clanId,
      });

      setSuccess(true);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || 'Error al registrar usuario'
      );
    } finally {
      setLoading(false);
    }
  };

  // Wrapper común para todo el contenido
  const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-military-900 via-military-800 to-military-900 dark:from-gray-900 dark:via-gray-800 dark:to-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="3xl" withGlow />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">
            {APP_CONFIG.name}
          </h1>
          <p className="text-military-300 dark:text-gray-400 text-sm">
            Gestión de eventos multiclan
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 border border-military-200 dark:border-gray-700">
          {children}
        </div>

        <p className="text-center text-military-400 dark:text-gray-500 text-xs mt-4">
          &copy; 2026 Arma Events Platform. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );

  if (loadingClans) {
    return (
      <PageWrapper>
        <LoadingSpinner />
      </PageWrapper>
    );
  }

  if (success) {
    return (
      <PageWrapper>
        <div className="text-center py-4">
          <div className="bg-green-500 p-3 rounded-full inline-flex mb-4">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-green-900 dark:text-green-300 mb-3">
            ¡Registro Exitoso!
          </h2>
          <p className="text-green-800 dark:text-green-400 mb-2 text-sm">
            Tu cuenta ha sido creada correctamente.
          </p>
          <p className="text-green-700 dark:text-green-500 text-xs mb-4">
            Un administrador o líder de clan debe validar tu cuenta.
            Recibirás un email cuando esté activada.
          </p>
          <Link
            to="/login"
            className="btn btn-primary"
          >
            Ir al Login
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <h2 className="text-xl font-bold text-military-900 dark:text-gray-100 mb-4 text-center">
        Crear Cuenta
      </h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 flex items-start text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Email y Nickname en grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1"
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input text-sm"
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label
              htmlFor="nickname"
              className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1"
            >
              Nickname *
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input text-sm"
              placeholder="Tu nombre en el juego"
              required
              disabled={loading}
              minLength={3}
            />
          </div>
        </div>

        {/* Contraseñas en grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1"
            >
              Contraseña *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input text-sm"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1"
            >
              Confirmar *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input text-sm"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={8}
            />
          </div>
        </div>
        <p className="text-xs text-military-500 dark:text-gray-400 -mt-1">
          Mínimo 8 caracteres con mayúsculas, minúsculas y números
        </p>

        <div>
          <label
            htmlFor="clan"
            className="block text-sm font-medium text-military-700 dark:text-gray-300 mb-1"
          >
            Clan *
          </label>
          <select
            id="clan"
            value={clanId}
            onChange={(e) => setClanId(e.target.value)}
            className="input text-sm"
            required
            disabled={loading}
          >
            <option value="">Selecciona un clan</option>
            {clansData?.clans.map((clan) => (
              <option key={clan.id} value={clan.id}>
                {clan.tag ? `${clan.tag} - ` : ''}
                {clan.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary flex items-center justify-center mt-4"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Registrando...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Crear Cuenta
            </>
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-sm text-military-600 dark:text-gray-400">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      {/* Información adicional - más compacta */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-xs text-blue-900 dark:text-blue-300 font-medium mb-1">
          📋 Proceso de registro:
        </p>
        <p className="text-xs text-blue-800 dark:text-blue-400">
          Completa el formulario → Selecciona tu clan → Espera validación → Recibe confirmación por email
        </p>
      </div>
    </PageWrapper>
  );
}