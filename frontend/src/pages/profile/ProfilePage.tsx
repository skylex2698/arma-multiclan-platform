import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useUpdateProfile, useChangePassword } from '../../hooks/useUsers';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { UserAvatar } from '../../components/ui/UserAvatar';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  // Estado de edición de perfil
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Estado de cambio de contraseña
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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
      await updateProfile.mutateAsync({ nickname, email });
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

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger' as const;
      case 'CLAN_LEADER':
        return 'warning' as const;
      default:
        return 'info' as const;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador';
      case 'CLAN_LEADER':
        return 'Líder de Clan';
      default:
        return 'Usuario';
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
                {getRoleLabel(user.role)}
              </Badge>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'default'}>
                {user.status === 'ACTIVE' ? 'Activo' : user.status}
              </Badge>
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
            </div>
          </div>
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
          </div>
        )}
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-military-900 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Cambiar Contraseña
          </h3>
          {!isChangingPassword && (
            <button
              onClick={() => setIsChangingPassword(true)}
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
          <form onSubmit={handleChangePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-military-700 mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input"
                  required
                />
              </div>

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
                  disabled={changePassword.isPending}
                  className="btn btn-primary flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {changePassword.isPending
                    ? 'Cambiando...'
                    : 'Cambiar Contraseña'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
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
            Haz clic en "Cambiar" para actualizar tu contraseña
          </p>
        )}
      </Card>

      {/* Solicitar cambio de clan */}
      <ClanChangeRequestForm currentClanId={user.clanId} />
    </div>
  );
}