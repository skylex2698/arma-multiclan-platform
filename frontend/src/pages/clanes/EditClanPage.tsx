import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useClan,
  useUpdateClan,
  useDeleteClan,
  useUploadClanAvatar,
  useDeleteClanAvatar,
} from '../../hooks/useClans';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, Save, Shield, Trash2, Upload, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export default function EditClanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clanData, isLoading } = useClan(id!);
  const updateClan = useUpdateClan(id!);
  const deleteClan = useDeleteClan();
  const uploadAvatar = useUploadClanAvatar(id!);
  const deleteAvatar = useDeleteClanAvatar(id!);

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Cargar datos del clan cuando estén disponibles
  useEffect(() => {
    if (clanData?.clan) {
      setName((prev) => prev || clanData.clan.name);
      setTag((prev) => prev || clanData.clan.tag || '');
      setDescription((prev) => prev || clanData.clan.description || '');
      if (clanData.clan.avatarUrl && !previewUrl) {
        setPreviewUrl(
          `http://localhost:3000${clanData.clan.avatarUrl}`
        );
      }
    }
  }, [clanData?.clan, previewUrl]);

  const canEdit =
    user?.role === 'ADMIN' ||
    (user?.role === 'CLAN_LEADER' && user?.clanId === id);

  const canDelete = user?.role === 'ADMIN';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }

      // Validar tamaño (2MB máximo)
      if (file.size > 2 * 1024 * 1024) {
        setError('El archivo no puede superar los 2MB');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveImage = async () => {
    setError('');

    // Si hay un archivo seleccionado pero no guardado, solo limpiar la selección
    if (selectedFile) {
      setSelectedFile(null);
      // Restaurar la imagen original del servidor si existe
      if (clanData?.clan.avatarUrl) {
        setPreviewUrl(`http://localhost:3000${clanData.clan.avatarUrl}`);
      } else {
        setPreviewUrl('');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Si hay una imagen del servidor, eliminarla
    if (clanData?.clan.avatarUrl) {
      try {
        await deleteAvatar.mutateAsync();
        setPreviewUrl('');
      } catch (err) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Error al eliminar el avatar');
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || name.length < 3) {
      setError('El nombre del clan debe tener al menos 3 caracteres');
      return;
    }

    try {
      // Primero subir imagen si hay una nueva
      if (selectedFile) {
        await uploadAvatar.mutateAsync(selectedFile);
      }

      // Luego actualizar datos del clan
      await updateClan.mutateAsync({
        name,
        tag: tag || undefined,
        description: description || undefined,
      });

      navigate(`/clanes/${id}`);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al actualizar el clan');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteClan.mutateAsync(id!);
      navigate('/clanes');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al eliminar el clan');
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!clanData?.clan) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">Clan no encontrado</p>
        <Link
          to="/clanes"
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver a clanes
        </Link>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="card bg-red-50 border border-red-200">
        <p className="text-red-700">No tienes permisos para editar este clan</p>
        <Link
          to="/clanes"
          className="text-primary-600 hover:text-primary-700 mt-2 inline-block"
        >
          Volver a clanes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to={`/clanes/${id}`}
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al clan
      </Link>

      <h1 className="text-3xl font-bold text-military-900 mb-6">Editar Clan</h1>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Logo del clan"
                className="w-20 h-20 rounded-full object-cover border-4 border-primary-200"
              />
            ) : (
              <div className="bg-primary-100 p-4 rounded-full">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-military-900">
                Información del Clan
              </h2>
              <p className="text-sm text-military-600">
                Modifica los datos del clan
              </p>
            </div>
          </div>

          {/* Logo del clan */}
          <div>
            <label className="block text-sm font-medium text-military-700 mb-2">
              Logo del Clan
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary flex items-center"
                disabled={uploadAvatar.isPending || deleteAvatar.isPending}
              >
                <Upload className="h-4 w-4 mr-2" />
                {selectedFile ? 'Cambiar Imagen' : 'Subir Imagen'}
              </button>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={deleteAvatar.isPending}
                  className="btn btn-outline flex items-center text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  {deleteAvatar.isPending ? 'Quitando...' : 'Quitar'}
                </button>
              )}
            </div>
            <p className="text-xs text-military-500 mt-1">
              Formatos: JPG, PNG, WEBP (máximo 2MB)
            </p>
            {selectedFile && (
              <p className="text-xs text-green-600 mt-2">
                ✓ Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Nombre del Clan *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Nombre completo del clan"
              required
              minLength={3}
              disabled={updateClan.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Tag del Clan
            </label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              className="input"
              placeholder="[TAG]"
              maxLength={10}
              disabled={updateClan.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              placeholder="Describe el clan, su propósito, estilo de juego, etc."
              disabled={updateClan.isPending}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-military-200">
            <button
              type="submit"
              disabled={updateClan.isPending || uploadAvatar.isPending || deleteAvatar.isPending}
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateClan.isPending || uploadAvatar.isPending
                ? 'Guardando...'
                : 'Guardar Cambios'}
            </button>
            <Link to={`/clanes/${id}`} className="btn btn-outline">
              Cancelar
            </Link>
          </div>
        </form>
      </Card>

      {/* Zona de peligro - Solo admin */}
      {canDelete && (
        <Card className="mt-6 bg-red-50 border-red-200">
          <h3 className="text-lg font-bold text-red-900 mb-2">
            Zona de Peligro
          </h3>
          <p className="text-sm text-red-700 mb-4">
            Eliminar este clan es una acción permanente. Todos los usuarios
            perderán su clan y los líderes perderán su rol.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="btn btn-danger flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar Clan
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-red-900">
                ¿Estás seguro? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={deleteClan.isPending}
                  className="btn btn-danger"
                >
                  {deleteClan.isPending ? 'Eliminando...' : 'Sí, Eliminar'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}