import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import {
  useUpdateProfile,
  useChangePassword,
  useSelfResetPassword,
} from '../../hooks/useUsers';
import { useUserReliability } from '../../hooks/useAttendance';
import { useCurrentUserGameIdentities, useGames, useUpsertCurrentUserGameIdentity } from '../../hooks/useGames';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { ReliabilityBadge } from '../../components/ui/ReliabilityBadge';
import { ClanChangeRequestForm } from '../../components/profile/ClanChangeRequestForm';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Key,
  Save,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Gamepad2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAllTimezoneOptions } from '../../utils/eventTime';
import { getRoleBadgeVariant, getRoleDisplayName } from '../../utils/permissions';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const selfResetPassword = useSelfResetPassword();
  const { data: reliabilityData } = useUserReliability(user?.id || '');
  const { data: gamesData } = useGames();
  const { data: identitiesData } = useCurrentUserGameIdentities();
  const upsertIdentity = useUpsertCurrentUserGameIdentity();

  // Estado de edición de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'Europe/Madrid');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Estado de cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordMode, setPasswordMode] = useState<'change' | 'reset'>('change');
  const [identityDrafts, setIdentityDrafts] = useState<Record<string, string>>({});

  if (!user) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">No se pudo cargar el perfil</p>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      await updateProfile.mutateAsync({ nickname, email, timezone });
      setProfileSuccess('Perfil actualizado correctamente');
      setIsEditingProfile(false);
      
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setProfileError(
        error.response?.data?.message || 'Error al actualizar perfil'
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validaciones
    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setPasswordSuccess('Contraseña actualizada correctamente');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(
        error.response?.data?.message || 'Error al cambiar contraseña'
      );
    }
  };

  const handleSelfResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await selfResetPassword.mutateAsync({ newPassword });
      setPasswordSuccess('Contraseña restablecida correctamente');
      setIsChangingPassword(false);
      setPasswordMode('change');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(
        error.response?.data?.message || 'Error al restablecer contraseña'
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-military-900 mb-6">Mi Perfil</h1>

      {/* Información del perfil */}
      <Card className="mb-6">
        <div className="flex items-start gap-6">
          <UserAvatar user={user} size="xl" showBorder={true} />
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-military-900 mb-2">
              {user.nickname}
            </h2>
            
            <div className="flex items-center gap-2 mb-4">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {getRoleDisplayName(user.role)}
              </Badge>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'default'}>
                {user.status === 'ACTIVE' ? 'Activo' : user.status}
              </Badge>
              {reliabilityData?.reliability?.score !== null && reliabilityData?.reliability?.score !== undefined && (
                <ReliabilityBadge score={reliabilityData.reliability.score} size="md" />
              )}
            </div>

            <div className="space-y-2 text-sm text-military-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>

              {user.clan && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>
                    {user.clan.tag && `${user.clan.tag} `}
                    {user.clan.name}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Miembro desde{' '}
                  {user.createdAt
                    ? format(new Date(user.createdAt), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })
                    : 'Fecha desconocida'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Zona horaria: {user.timezone || 'Europe/Madrid'}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-military-900 flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" />
            Identidades de juego opcionales
          </h3>
        </div>

        <div className="space-y-3">
          {(gamesData?.games || [])
            .filter((game) => game.identityMode !== 'NONE')
            .map((game) => {
              const currentIdentity = identitiesData?.identities.find(
                (identity) => identity.gameId === game.id
              );
              const draftValue =
                identityDrafts[game.id] ??
                currentIdentity?.value ??
                '';

              return (
                <div
                  key={game.id}
                  className="grid gap-3 rounded-md border border-military-200 p-3 dark:border-gray-700 md:grid-cols-[220px_minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-military-900 dark:text-gray-100">
                      {game.name}
                    </p>
                    <p className="section-caption">
                      {game.identityLabel || 'Identidad'}
                    </p>
                  </div>

                  <input
                    value={draftValue}
                    onChange={(e) =>
                      setIdentityDrafts((prev) => ({
                        ...prev,
                        [game.id]: e.target.value,
                      }))
                    }
                    className="input"
                    placeholder={game.identityLabel || 'Identidad'}
                  />

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={upsertIdentity.isPending}
                    onClick={() =>
                      upsertIdentity.mutate({
                        gameId: game.id,
                        data: { value: draftValue },
                      })
                    }
                  >
                    Guardar
                  </button>
                </div>
              );
            })}
        </div>
      </Card>

      {/* Mensajes de éxito/error globales */}
      {profileSuccess && (
        <div className="card bg-green-50 border border-green-200 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{profileSuccess}</p>
          </div>
        </div>
      )}

      {passwordSuccess && (
        <div className="card bg-green-50 border border-green-200 mb-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-green-700">{passwordSuccess}</p>
          </div>
        </div>
      )}

      {/* Editar información personal */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-military-900 flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </h3>
          {!isEditingProfile && (
            <button
              onClick={() => {
                setIsEditingProfile(true);
                setNickname(user.nickname);
                setEmail(user.email || '');
                setTimezone(user.timezone || 'Europe/Madrid');
              }}
              className="btn btn-secondary btn-sm"
            >
              Editar
            </button>
          )}
        </div>

        {profileError && (
          <div className="card bg-red-50 border border-red-200 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{profileError}</p>
            </div>
          </div>
        )}

        {isEditingProfile ? (
          <form onSubmit={handleUpdateProfile}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Nickname *
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="input"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Zona horaria
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input"
                >
                  {getAllTimezoneOptions().map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="btn btn-primary flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingProfile(false);
                    setProfileError('');
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-military-600">
            <p>
              <strong>Nickname:</strong> {user.nickname}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Zona horaria:</strong> {user.timezone || 'Europe/Madrid'}
            </p>
          </div>
        )}
      </Card>

      {/* Fiabilidad */}
      {reliabilityData?.reliability && reliabilityData.reliability.totalEvents > 0 && (
        <Card className="mb-6">
          <h3 className="text-xl font-bold text-military-900 dark:text-gray-100 flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5" />
            Fiabilidad
          </h3>

          {user.blockedUntil && new Date(user.blockedUntil) > new Date() && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">
                Bloqueado temporalmente hasta el{' '}
                {new Date(user.blockedUntil).toLocaleDateString('es-ES')} por ausencias reiteradas.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-military-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold text-military-900 dark:text-gray-100">
                {reliabilityData.reliability.score !== null
                  ? `${reliabilityData.reliability.score}%`
                  : '-'}
              </p>
              <p className="text-xs text-military-500 dark:text-gray-400">Score</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                {reliabilityData.reliability.present}
              </p>
              <p className="text-xs text-military-500 dark:text-gray-400">Presente</p>
            </div>
            <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                {reliabilityData.reliability.justifiedAbsent}
              </p>
              <p className="text-xs text-military-500 dark:text-gray-400">Justificado</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                {reliabilityData.reliability.noShow}
              </p>
              <p className="text-xs text-military-500 dark:text-gray-400">No-Show</p>
            </div>
          </div>

          <p className="text-xs text-military-500 dark:text-gray-500 mt-3">
            Basado en {reliabilityData.reliability.totalEvents} evento{reliabilityData.reliability.totalEvents !== 1 ? 's' : ''}.
            {reliabilityData.reliability.recentNoShows > 0 && (
              <span className="text-red-500">
                {' '}{reliabilityData.reliability.recentNoShows} no-show{reliabilityData.reliability.recentNoShows !== 1 ? 's' : ''} en los últimos 10 eventos.
              </span>
            )}
          </p>
        </Card>
      )}

      {/* Cambiar contraseña */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-military-900 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </h3>
          {!isChangingPassword && (
            <button
              onClick={() => {
                setIsChangingPassword(true);
                setPasswordMode('change');
              }}
              className="btn btn-secondary btn-sm"
            >
              Cambiar
            </button>
          )}
        </div>

        {passwordError && (
          <div className="card bg-red-50 border border-red-200 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-700">{passwordError}</p>
            </div>
          </div>
        )}

        {isChangingPassword ? (
          <form onSubmit={passwordMode === 'change' ? handleChangePassword : handleSelfResetPassword}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={passwordMode === 'change' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  onClick={() => setPasswordMode('change')}
                >
                  Con contraseña actual
                </button>
                <button
                  type="button"
                  className={passwordMode === 'reset' ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
                  onClick={() => setPasswordMode('reset')}
                >
                  Restablecer
                </button>
              </div>

              {passwordMode === 'change' && (
                <div>
                  <label className="block text-sm font-medium text-military-700 mb-1">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    required={passwordMode === 'change'}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
                <p className="text-xs text-military-500 mt-1">
                  Mínimo 8 caracteres, una mayúscula, una minúscula y un número
                </p>
                {passwordMode === 'reset' && (
                  <p className="text-xs text-military-500 mt-1">
                    Este restablecimiento funciona mientras tu sesión siga abierta.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  required
                  minLength={8}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={changePassword.isPending || selfResetPassword.isPending}
                  className="btn btn-primary flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {changePassword.isPending || selfResetPassword.isPending
                    ? passwordMode === 'change'
                      ? 'Cambiando...'
                      : 'Restableciendo...'
                    : passwordMode === 'change'
                      ? 'Cambiar Contraseña'
                      : 'Restablecer Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordMode('change');
                    setPasswordError('');
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="text-military-600">
            Puedes cambiarla con la actual o restablecerla directamente mientras tu sesión siga abierta
          </p>
        )}
      </Card>

      {/* Solicitar cambio de clan */}
      <ClanChangeRequestForm currentClanId={user.clanId} />
    </div>
  );
}
