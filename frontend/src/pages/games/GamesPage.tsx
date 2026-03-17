import { useMemo, useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import { useCreateGame, useDeleteGame, useGames, useUpdateGame } from '../../hooks/useGames';
import type { Game, GameIdentityMode } from '../../types';

const EMPTY_FORM = {
  name: '',
  slug: '',
  supportsModsetHtml: false,
  identityMode: 'NONE' as GameIdentityMode,
  identityLabel: '',
  sortOrder: 0,
};

export default function GamesPage() {
  const { data, isLoading } = useGames({ includeInactive: true });
  const createGame = useCreateGame();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();
  const [drafts, setDrafts] = useState<Record<string, Partial<Game>>>({});
  const [newGame, setNewGame] = useState(EMPTY_FORM);

  const games = data?.games || [];

  const orderedGames = useMemo(
    () => [...games].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [games]
  );

  const updateDraft = (gameId: string, changes: Partial<Game>) => {
    setDrafts((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        ...changes,
      },
    }));
  };

  const resolveDraft = (game: Game) => ({
    ...game,
    ...drafts[game.id],
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGame.mutateAsync({
      ...newGame,
      identityLabel: newGame.identityLabel || undefined,
    });
    setNewGame(EMPTY_FORM);
  };

  const handleSave = async (game: Game) => {
    const draft = drafts[game.id];
    if (!draft) return;

    await updateGame.mutateAsync({
      id: game.id,
      data: {
        ...draft,
        identityLabel:
          draft.identityLabel === '' ? undefined : draft.identityLabel,
      },
    });

    setDrafts((prev) => {
      const next = { ...prev };
      delete next[game.id];
      return next;
    });
  };

  const handleDelete = async (game: Game) => {
    const confirmation = window.confirm(
      `¿Eliminar el juego "${game.name}"? Si existen identidades de jugadores asociadas a este juego, se borraran tambien.`
    );

    if (!confirmation) {
      return;
    }

    try {
      const result = await deleteGame.mutateAsync(game.id);
      const deletedIdentities = result.game.deletedIdentities || 0;

      if (deletedIdentities > 0) {
        window.alert(
          `Juego eliminado. Tambien se borraron ${deletedIdentities} registro(s) de identidad asociados a este juego.`
        );
      }
    } catch (error) {
      const requestError = error as { response?: { data?: { message?: string } } };
      window.alert(
        requestError.response?.data?.message || 'No se pudo eliminar el juego.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="page-header">
        <div>
          <h1 className="page-title">Catalogo de juegos</h1>
          <p className="page-subtitle">
            Juegos editables para clanes, eventos e identidades.
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Nuevo juego</h2>
            <p className="section-caption">
              Define el juego, su identidad y el orden de uso en la plataforma.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_180px_180px_110px]">
            <div>
              <label className="field-label">Nombre *</label>
              <input
                value={newGame.name}
                onChange={(e) => setNewGame((prev) => ({ ...prev, name: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div>
              <label className="field-label">Slug</label>
              <input
                value={newGame.slug}
                onChange={(e) => setNewGame((prev) => ({ ...prev, slug: e.target.value }))}
                className="input"
                placeholder="arma-4"
              />
            </div>

            <div>
              <label className="field-label">Identidad</label>
              <select
                value={newGame.identityMode}
                onChange={(e) =>
                  setNewGame((prev) => ({
                    ...prev,
                    identityMode: e.target.value as GameIdentityMode,
                  }))
                }
                className="input"
              >
                <option value="NONE">Sin identidad</option>
                <option value="STEAM64">Steam64</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>

            <div>
              <label className="field-label">Etiqueta identidad</label>
              <input
                value={newGame.identityLabel}
                onChange={(e) =>
                  setNewGame((prev) => ({ ...prev, identityLabel: e.target.value }))
                }
                className="input"
                placeholder="Steam64 / UID / GamerTag"
              />
            </div>

            <div>
              <label className="field-label">Orden</label>
              <input
                type="number"
                value={newGame.sortOrder}
                onChange={(e) =>
                  setNewGame((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))
                }
                className="input"
                min={0}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-military-200 px-3 py-2 text-sm text-military-700 dark:border-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={newGame.supportsModsetHtml}
                onChange={(e) =>
                  setNewGame((prev) => ({
                    ...prev,
                    supportsModsetHtml: e.target.checked,
                  }))
                }
              />
              Soporta modset HTML
            </label>

            <button type="submit" className="btn btn-primary" disabled={createGame.isPending}>
              <Save className="h-4 w-4" />
              {createGame.isPending ? 'Guardando...' : 'Crear juego'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2 className="section-title">Juegos configurados</h2>
            <p className="section-caption">
              {orderedGames.length} registros en el catalogo.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="empty-state">Cargando juegos...</div>
        ) : orderedGames.length === 0 ? (
          <div className="empty-state">No hay juegos configurados.</div>
        ) : (
          <div className="space-y-3">
            {orderedGames.map((game) => {
              const draft = resolveDraft(game);
              const hasDraft = Boolean(drafts[game.id]);

              return (
                <div
                  key={game.id}
                  className="rounded-md border border-military-200 p-4 dark:border-gray-700"
                >
                  <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.1fr)_170px_180px_110px]">
                    <div>
                      <label className="field-label">Nombre</label>
                      <input
                        value={draft.name}
                        onChange={(e) => updateDraft(game.id, { name: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="field-label">Slug</label>
                      <input
                        value={draft.slug}
                        onChange={(e) => updateDraft(game.id, { slug: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="field-label">Etiqueta identidad</label>
                      <input
                        value={draft.identityLabel || ''}
                        onChange={(e) =>
                          updateDraft(game.id, { identityLabel: e.target.value })
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="field-label">Estado</label>
                      <select
                        value={draft.status}
                        onChange={(e) =>
                          updateDraft(game.id, {
                            status: e.target.value as Game['status'],
                          })
                        }
                        className="input"
                      >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Modo identidad</label>
                      <select
                        value={draft.identityMode}
                        onChange={(e) =>
                          updateDraft(game.id, {
                            identityMode: e.target.value as GameIdentityMode,
                          })
                        }
                        className="input"
                      >
                        <option value="NONE">Sin identidad</option>
                        <option value="STEAM64">Steam64</option>
                        <option value="MANUAL">Manual</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Orden</label>
                      <input
                        type="number"
                        value={draft.sortOrder}
                        onChange={(e) =>
                          updateDraft(game.id, {
                            sortOrder: Number(e.target.value),
                          })
                        }
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-military-200 pt-3 dark:border-gray-700">
                    <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-military-200 px-3 py-2 text-sm text-military-700 dark:border-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={draft.supportsModsetHtml}
                        onChange={(e) =>
                          updateDraft(game.id, {
                            supportsModsetHtml: e.target.checked,
                          })
                        }
                      />
                      Soporta modset HTML
                    </label>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSave(game)}
                        disabled={!hasDraft || updateGame.isPending || deleteGame.isPending}
                      >
                        <Save className="h-4 w-4" />
                        Guardar
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleDelete(game)}
                        disabled={updateGame.isPending || deleteGame.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
