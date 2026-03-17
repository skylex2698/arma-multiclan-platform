import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { useClans } from '../../hooks/useClans';
import { authService } from '../../services/authService';
import { Logo } from '../../components/ui/Logo';
import { APP_CONFIG } from '../../config/app.config';

export default function DiscordCompleteRegistrationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: clansData, isLoading } = useClans();

  const discordId = searchParams.get('discordId') || '';
  const discordUsername = searchParams.get('discordUsername') || '';
  const email = searchParams.get('email') || '';

  const [nickname, setNickname] = useState(discordUsername);
  const [clanId, setClanId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const clans = useMemo(() => clansData?.clans || [], [clansData?.clans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!discordId || !discordUsername) {
      setError('Faltan datos de Discord. Reinicia el acceso con Discord.');
      return;
    }

    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres.');
      return;
    }

    if (!clanId) {
      setError('Debes seleccionar un clan.');
      return;
    }

    setSaving(true);

    try {
      await authService.completeDiscordRegistration({
        discordId,
        discordUsername,
        email: email || undefined,
        nickname: nickname.trim(),
        clanId,
      });

      const pendingUrl = email
        ? `/auth/pending?email=${encodeURIComponent(email)}`
        : '/auth/pending';
      navigate(pendingUrl, { replace: true });
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setError(
        requestError.response?.data?.message ||
          'No se pudo completar el registro con Discord.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-military-900 via-military-800 to-military-900 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-black">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <Logo size="3xl" withGlow />
          </div>
          <h1 className="mb-1 text-3xl font-bold text-white">{APP_CONFIG.name}</h1>
          <p className="text-sm text-military-300 dark:text-gray-400">
            Completar registro con Discord
          </p>
        </div>

        <div className="rounded-lg border border-military-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-4 text-center text-xl font-bold text-military-900 dark:text-gray-100">
            Completa tu acceso
          </h2>

          {error && (
            <div className="mb-4 flex items-start rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
              <AlertCircle className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-military-700 dark:text-gray-300">
                Usuario de Discord
              </label>
              <input
                type="text"
                value={discordUsername}
                className="input text-sm"
                disabled
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-military-700 dark:text-gray-300">
                Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="input text-sm"
                required
                minLength={3}
                disabled={saving}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-military-700 dark:text-gray-300">
                Clan
              </label>
              <select
                value={clanId}
                onChange={(e) => setClanId(e.target.value)}
                className="input text-sm"
                required
                disabled={saving || isLoading}
              >
                <option value="">Selecciona un clan</option>
                {clans.map((clan) => (
                  <option key={clan.id} value={clan.id}>
                    {clan.tag ? `${clan.tag} - ` : ''}
                    {clan.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || isLoading}
              className="btn btn-primary flex w-full items-center justify-center"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Completar registro
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Volver al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
