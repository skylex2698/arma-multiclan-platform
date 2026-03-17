import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Shield, Upload, X } from 'lucide-react';
import { useCreateClan } from '../../hooks/useClans';
import { clanService, sanitizeClanTag } from '../../services/clanService';
import { useGames } from '../../hooks/useGames';
import { useCurrentApprovedClanCreationRequest } from '../../hooks/useUsers';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

export default function CreateClanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const createClan = useCreateClan();
  const setAuth = useAuthStore((state) => state.setAuth);
  const user = useAuthStore((state) => state.user);
  const isOnboarding = searchParams.get('onboarding') === 'true' || user?.mustCreateClanOnboarding;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: gamesData } = useGames();
  const { data: clanRequestData } = useCurrentApprovedClanCreationRequest(Boolean(isOnboarding));

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [primaryGameId, setPrimaryGameId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!primaryGameId && gamesData?.games?.length) {
      setPrimaryGameId(gamesData.games[0].id);
    }
  }, [primaryGameId, gamesData?.games]);

  useEffect(() => {
    if (!isOnboarding || !clanRequestData?.request) {
      return;
    }

    const request = clanRequestData.request;
    setName((current) => current || request.requestedName);
    setTag((current) => current || sanitizeClanTag(request.requestedTag));
    setDescription((current) => current || request.requestedDescription || '');
    setPrimaryGameId((current) => current || request.primaryGameId);
  }, [clanRequestData, isOnboarding]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten archivos de imagen.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('El logo no puede superar los 2 MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || name.length < 3) {
      setError('El nombre del clan debe tener al menos 3 caracteres.');
      return;
    }

    if (!primaryGameId) {
      setError('Selecciona el juego principal del clan.');
      return;
    }

    try {
      const result = await createClan.mutateAsync({
        name,
        tag: tag || undefined,
        description: description || undefined,
        primaryGameId,
      });

      if (selectedFile) {
        await clanService.uploadAvatar(result.clan.id, selectedFile);
        await queryClient.invalidateQueries({ queryKey: ['clans'] });
        await queryClient.invalidateQueries({ queryKey: ['clan', result.clan.id] });
      }

      if (user?.mustCreateClanOnboarding) {
        const refreshedAuth = await authService.getMe();
        setAuth(refreshedAuth.user);
      }

      navigate(`/clanes/${result.clan.id}`);
    } catch (err) {
      const requestError = err as { response?: { data?: { message?: string } } };
      setError(requestError.response?.data?.message || 'Error al crear el clan');
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link to="/clanes" className="inline-flex items-center gap-2 toolbar-link">
        <ArrowLeft className="h-4 w-4" />
        {isOnboarding ? 'Volver' : 'Volver a clanes'}
      </Link>

      <header className="space-y-1">
        <h1 className="page-title">
          {isOnboarding ? 'Completa la creación de tu clan' : 'Crear nuevo clan'}
        </h1>
        <p className="page-subtitle">
          {isOnboarding
            ? 'Tu solicitud ya fue aprobada. Solo falta crear el clan para terminar el alta.'
            : 'Puedes dar de alta el clan con su logo desde el primer guardado.'}
        </p>
      </header>

      {error && (
        <section className="panel border-red-300 bg-red-50/80 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </section>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2 className="section-title">Identidad del clan</h2>
              <p className="section-caption">
                Nombre, tag y logo en una sola vista compacta.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div className="flex items-center justify-center rounded-md border border-military-200 bg-military-50/60 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview del logo del clan"
                    className="h-28 w-28 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-md border border-dashed border-military-300 dark:border-gray-600">
                    <Shield className="h-10 w-10 text-military-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline"
                  disabled={createClan.isPending}
                >
                  <Upload className="h-4 w-4" />
                  {selectedFile ? 'Cambiar logo' : 'Subir logo'}
                </button>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn btn-outline"
                  >
                    <X className="h-4 w-4" />
                    Quitar
                  </button>
                )}
              </div>

              <p className="field-help">JPG, PNG o WEBP. Maximo 2 MB.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="field-label">Nombre del clan *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Nombre completo del clan"
                  required
                  minLength={3}
                  disabled={createClan.isPending}
                />
                <p className="field-help">Minimo 3 caracteres y nombre unico.</p>
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="field-label">Tag</label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(sanitizeClanTag(e.target.value))}
                    className="input"
                    placeholder="TAG"
                    maxLength={10}
                    disabled={createClan.isPending}
                  />
                  <p className="field-help">Opcional. Se eliminan automaticamente [] () {}. Maximo 10 caracteres.</p>
                </div>

                <div>
                  <label className="field-label">Juego principal *</label>
                  <select
                    value={primaryGameId}
                    onChange={(e) => setPrimaryGameId(e.target.value)}
                    className="input"
                    disabled={createClan.isPending}
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
              </div>

              <div>
                <label className="field-label">Descripcion</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input min-h-[120px]"
                  rows={5}
                  placeholder="Describe el clan, su estilo y proposito."
                  disabled={createClan.isPending}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {!isOnboarding && (
            <Link to="/clanes" className="btn btn-outline">
              Cancelar
            </Link>
          )}

          <button
            type="submit"
            disabled={createClan.isPending}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4" />
            {createClan.isPending ? 'Creando...' : 'Crear clan'}
          </button>
        </div>
      </form>
    </div>
  );
}
