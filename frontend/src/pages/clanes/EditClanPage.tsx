import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  useClan,
  useClanNotionIntegration,
  useUpdateClan,
  useDeleteClan,
  useUploadClanAvatar,
  useDeleteClanAvatar,
  useSaveClanNotionIntegration,
  useTestClanNotionConnection,
} from '../../hooks/useClans';
import { useAuthStore } from '../../store/authStore';
import { ArrowLeft, ChevronDown, ChevronUp, Plug, Save, Shield, Trash2, Upload, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { getAssetUrl } from '../../utils/url';
import { useGames } from '../../hooks/useGames';
import { sanitizeClanTag } from '../../services/clanService';
import type { NotionSyncMode } from '../../types';

export default function EditClanPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: clanData, isLoading } = useClan(id!);
  const { data: notionData, isLoading: isLoadingNotion } = useClanNotionIntegration(id!);
  const updateClan = useUpdateClan(id!);
  const saveNotionIntegration = useSaveClanNotionIntegration(id!);
  const testNotionConnection = useTestClanNotionConnection(id!);
  const deleteClan = useDeleteClan();
  const uploadAvatar = useUploadClanAvatar(id!);
  const deleteAvatar = useDeleteClanAvatar(id!);
  const { data: gamesData } = useGames({ includeInactive: true });

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [primaryGameId, setPrimaryGameId] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [notionEnabled, setNotionEnabled] = useState(false);
  const [notionToken, setNotionToken] = useState('');
  const [parentPageId, setParentPageId] = useState('');
  const [missionsDatabaseId, setMissionsDatabaseId] = useState('');
  const [participationsDatabaseId, setParticipationsDatabaseId] = useState('');
  const [notionSyncMode, setNotionSyncMode] = useState<NotionSyncMode>('MANUAL');
  const [notionError, setNotionError] = useState('');
  const [notionSuccess, setNotionSuccess] = useState('');
  const [activeSection, setActiveSection] = useState<'clan' | 'connectors'>('clan');
  const [isNotionExpanded, setIsNotionExpanded] = useState(true);

  // Cargar datos del clan cuando estén disponibles
  useEffect(() => {
    if (clanData?.clan) {
      setName((prev) => prev || clanData.clan.name);
      setTag((prev) => prev || sanitizeClanTag(clanData.clan.tag || ''));
      setDescription((prev) => prev || clanData.clan.description || '');
      setPrimaryGameId((prev) => prev || clanData.clan.primaryGameId);
      if (clanData.clan.avatarUrl && !previewUrl) {
        setPreviewUrl(getAssetUrl(clanData.clan.avatarUrl) || '');
      }
    }
  }, [clanData?.clan, previewUrl]);

  useEffect(() => {
    if (notionData?.integration) {
      setNotionEnabled(notionData.integration.enabled);
      setParentPageId(notionData.integration.parentPageId || '');
      setMissionsDatabaseId(notionData.integration.missionsDatabaseId || '');
      setParticipationsDatabaseId(notionData.integration.participationsDatabaseId || '');
      setNotionSyncMode(notionData.integration.syncMode);
    }
  }, [notionData?.integration]);

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
        setPreviewUrl(getAssetUrl(clanData.clan.avatarUrl) || '');
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

    if (!primaryGameId) {
      setError('Selecciona el juego principal del clan');
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
        primaryGameId,
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

  const handleSaveNotionIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotionError('');
    setNotionSuccess('');

    try {
      const result = await saveNotionIntegration.mutateAsync({
        enabled: notionEnabled,
        token: notionToken || undefined,
        parentPageId: parentPageId || undefined,
        syncMode: notionSyncMode,
      });

      setNotionToken('');
      setNotionEnabled(result.integration.enabled);
      setParentPageId(result.integration.parentPageId || '');
      setMissionsDatabaseId(result.integration.missionsDatabaseId || '');
      setParticipationsDatabaseId(result.integration.participationsDatabaseId || '');
      setNotionSyncMode(result.integration.syncMode);
      setNotionSuccess('Configuración de Notion guardada correctamente');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotionError(error.response?.data?.message || 'Error al guardar la integración de Notion');
    }
  };

  const handleTestNotionConnection = async () => {
    setNotionError('');
    setNotionSuccess('');

    try {
      const result = await testNotionConnection.mutateAsync({
        token: notionToken || undefined,
        parentPageId: parentPageId || undefined,
      });
      const workspaceSuffix = result.workspaceName ? ` en ${result.workspaceName}` : '';
      const parentPageSuffix = result.parentPageValidated
        ? ' y acceso confirmado a la página padre'
        : '';
      setNotionSuccess(
        `Conexión válida con ${result.botName}${workspaceSuffix}${parentPageSuffix}`
      );
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setNotionError(error.response?.data?.message || 'No se pudo validar la conexión con Notion');
    }
  };

  if (isLoading || isLoadingNotion) {
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

      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSection('clan')}
            className={`btn btn-sm ${activeSection === 'clan' ? 'btn-primary' : 'btn-outline'}`}
          >
            Datos del clan
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('connectors')}
            className={`btn btn-sm ${activeSection === 'connectors' ? 'btn-primary' : 'btn-outline'}`}
          >
            Conectores
          </button>
        </div>
      </Card>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {activeSection === 'clan' && (
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
              onChange={(e) => setTag(sanitizeClanTag(e.target.value))}
              className="input"
              placeholder="TAG"
              maxLength={10}
              disabled={updateClan.isPending}
            />
            <p className="text-xs text-military-500 mt-1">
              Se eliminan automaticamente [] () {}. Maximo 10 caracteres.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-military-700 mb-1">
              Juego principal *
            </label>
            <select
              value={primaryGameId}
              onChange={(e) => setPrimaryGameId(e.target.value)}
              className="input"
              disabled={updateClan.isPending}
              required
            >
              <option value="">Selecciona un juego</option>
              {(gamesData?.games || []).map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
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
      )}

      {activeSection === 'connectors' && (
      <Card className="mt-6">
        <form onSubmit={handleSaveNotionIntegration} className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-military-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => setIsNotionExpanded((prev) => !prev)}
              className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-military-50 dark:hover:bg-gray-800"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary-100 p-2.5 dark:bg-tactical-900">
                    <Plug className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${notionEnabled ? 'bg-green-500' : 'bg-military-300 dark:bg-gray-600'}`} />
                  <div>
                    <p className="font-semibold text-military-900 dark:text-gray-100">Notion</p>
                    <p className="mt-0.5 text-sm text-military-600 dark:text-gray-400">
                      Configura la conexión de este clan con su espacio de Notion.
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${notionEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-military-100 text-military-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {notionEnabled ? 'Habilitado' : 'Desactivado'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-military-600 dark:text-gray-400">
                  CCT mantiene un bloque autónomo de datos en Notion para este clan.
                </p>
              </div>
              <div className="ml-4 flex h-10 w-10 items-center justify-center rounded-full border border-military-200 text-military-600 dark:border-gray-700 dark:text-gray-300">
                {isNotionExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {isNotionExpanded && (
              <div className="border-t border-military-200 px-5 py-5 dark:border-gray-700">
                {notionError && (
                  <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    {notionError}
                  </div>
                )}

                {notionSuccess && (
                  <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
                    {notionSuccess}
                  </div>
                )}

                <div className="mb-5 rounded-xl border border-military-200 bg-military-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
                  <label className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-military-900 dark:text-gray-100">Habilitar integración con Notion</p>
                      <p className="text-sm text-military-600 dark:text-gray-400">
                        Si está desactivada, CCT no usará ni actualizará sus bases propias en Notion.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notionEnabled}
                      onClick={() => setNotionEnabled((prev) => !prev)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                        notionEnabled
                          ? 'bg-primary-600'
                          : 'bg-military-300 dark:bg-gray-600'
                      }`}
                      disabled={saveNotionIntegration.isPending}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          notionEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>

                {notionEnabled && (
                  <div className="space-y-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-military-700 dark:text-gray-300">
                          Token de integración de Notion
                        </label>
                        <input
                          type="password"
                          value={notionToken}
                          onChange={(e) => setNotionToken(e.target.value)}
                          className="input"
                          placeholder={notionData?.integration.maskedToken || 'ntn_...'}
                          autoComplete="new-password"
                          disabled={saveNotionIntegration.isPending}
                        />
                        <p className="mt-1 text-xs text-military-500 dark:text-gray-400">
                          Déjalo vacío para mantener el token actual.
                        </p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-military-700 dark:text-gray-300">
                          ID de página padre de Notion
                        </label>
                        <input
                          type="text"
                          value={parentPageId}
                          onChange={(e) => setParentPageId(e.target.value)}
                          className="input"
                          placeholder="Página contenedora donde CCT aprovisionará las bases del clan"
                          disabled={saveNotionIntegration.isPending}
                        />
                        <p className="mt-1 text-xs text-military-500 dark:text-gray-400">
                          Comparte esa página con la integración. CCT detectará o creará
                          automáticamente `DB_MISIONES_CCT` y `DB_PARTICIPACIONES_CCT` como
                          un bloque autónomo de datos operativos. No tocará otras bases internas
                          del clan.
                        </p>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-military-700 dark:text-gray-300">
                          Modo de sincronización
                        </label>
                        <select
                          value={notionSyncMode}
                          onChange={(e) => setNotionSyncMode(e.target.value as NotionSyncMode)}
                          className="input"
                          disabled={saveNotionIntegration.isPending}
                        >
                          <option value="MANUAL">Manual</option>
                          <option value="AUTO">Automática</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 rounded-xl border border-military-200 bg-military-50 px-4 py-4 dark:border-gray-700 dark:bg-gray-800">
                        <p className="text-sm font-medium text-military-900 dark:text-gray-100">
                          Bloque autónomo resuelto por CCT
                        </p>
                        <p className="mt-1 text-xs text-military-500 dark:text-gray-400">
                          Estos IDs se generan o descubren automáticamente al guardar la
                          integración. CCT solo escribe en estas dos bases y no depende del
                          resto del modelo Notion del clan.
                        </p>

                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-military-500 dark:text-gray-400">
                              DB_MISIONES_CCT
                            </label>
                            <input
                              type="text"
                              value={missionsDatabaseId}
                              className="input"
                              readOnly
                              placeholder="Se resolverá automáticamente"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-military-500 dark:text-gray-400">
                              DB_PARTICIPACIONES_CCT
                            </label>
                            <input
                              type="text"
                              value={participationsDatabaseId}
                              className="input"
                              readOnly
                              placeholder="Se resolverá automáticamente"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 border-t border-military-200 pt-4 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={saveNotionIntegration.isPending}
                        className="btn btn-primary flex items-center"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saveNotionIntegration.isPending ? 'Guardando...' : 'Guardar Integración'}
                      </button>
                      <button
                        type="button"
                        onClick={handleTestNotionConnection}
                        disabled={
                          testNotionConnection.isPending ||
                          (!notionToken && !notionData?.integration.hasToken)
                        }
                        className="btn btn-outline"
                      >
                        {testNotionConnection.isPending ? 'Probando...' : 'Probar conexión'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </Card>
      )}

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
