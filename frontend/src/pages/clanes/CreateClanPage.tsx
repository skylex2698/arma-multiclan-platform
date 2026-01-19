import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCreateClan } from '../../hooks/useClans';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function CreateClanPage() {
  const navigate = useNavigate();
  const createClan = useCreateClan();

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || name.length < 3) {
      setError('El nombre del clan debe tener al menos 3 caracteres');
      return;
    }

    try {
      await createClan.mutateAsync({
        name,
        tag: tag || undefined,
        description: description || undefined,
      });
      navigate('/clanes');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Error al crear el clan');
    }
  };

  return (
    <div>
      <Link
        to="/clanes"
        className="inline-flex items-center text-military-600 hover:text-military-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a clanes
      </Link>

      <h1 className="text-3xl font-bold text-military-900 mb-6">
        Crear Nuevo Clan
      </h1>

      {error && (
        <div className="card bg-red-50 border border-red-200 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-primary-100 p-4 rounded-full">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-military-900">
                Información del Clan
              </h2>
              <p className="text-sm text-military-600">
                Completa los datos del nuevo clan
              </p>
            </div>
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
              disabled={createClan.isPending}
            />
            <p className="text-xs text-military-500 mt-1">
              Mínimo 3 caracteres, debe ser único
            </p>
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
              disabled={createClan.isPending}
            />
            <p className="text-xs text-military-500 mt-1">
              Opcional, máximo 10 caracteres (ej: [ALFA], [BRAVO])
            </p>
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
              disabled={createClan.isPending}
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-military-200">
            <button
              type="submit"
              disabled={createClan.isPending}
              className="btn btn-primary flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              {createClan.isPending ? 'Creando...' : 'Crear Clan'}
            </button>
            <Link to="/clanes" className="btn btn-outline">
              Cancelar
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}