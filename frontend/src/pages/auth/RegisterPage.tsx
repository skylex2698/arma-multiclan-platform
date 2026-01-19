import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useClans } from '../../hooks/useClans';
import { UserPlus, Loader2, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function RegisterPage() {
  const navigate = useNavigate();
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

  if (loadingClans) {
    return <LoadingSpinner />;
  }

  if (success) {
    return (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="bg-green-500 p-2 rounded-full mr-3">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-green-900">
              ¡Registro Exitoso!
            </h2>
          </div>
          <p className="text-green-800 mb-4">
            Tu cuenta ha sido creada correctamente. Un administrador o líder de
            clan debe validar tu cuenta antes de que puedas acceder.
          </p>
          <p className="text-green-700 text-sm">
            Recibirás un email cuando tu cuenta sea validada.
          </p>
        </div>

        <div className="text-center">
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-military-900 mb-6">
        Crear Cuenta
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-military-700 mb-1"
          >
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="tu@email.com"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label
            htmlFor="nickname"
            className="block text-sm font-medium text-military-700 mb-1"
          >
            Nickname *
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="input"
            placeholder="Tu nombre en el juego"
            required
            disabled={loading}
            minLength={3}
          />
          <p className="text-xs text-military-500 mt-1">
            Mínimo 3 caracteres
          </p>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-military-700 mb-1"
          >
            Contraseña *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={8}
          />
          <p className="text-xs text-military-500 mt-1">
            Mínimo 8 caracteres, incluye mayúsculas, minúsculas y números
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-military-700 mb-1"
          >
            Confirmar Contraseña *
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        <div>
          <label
            htmlFor="clan"
            className="block text-sm font-medium text-military-700 mb-1"
          >
            Clan *
          </label>
          <select
            id="clan"
            value={clanId}
            onChange={(e) => setClanId(e.target.value)}
            className="input"
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
          <p className="text-xs text-military-500 mt-1">
            Un líder de clan o administrador debe aprobar tu solicitud
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn btn-primary flex items-center justify-center"
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

      <div className="mt-6 text-center">
        <p className="text-sm text-military-600">
          ¿Ya tienes cuenta?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Inicia sesión aquí
          </Link>
        </p>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900 font-medium mb-2">
          📋 Proceso de registro:
        </p>
        <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
          <li>Completa el formulario con tus datos</li>
          <li>Selecciona el clan al que deseas unirte</li>
          <li>Espera la validación de un administrador o líder de clan</li>
          <li>Recibirás un email cuando tu cuenta esté activada</li>
        </ol>
      </div>
    </div>
  );
}