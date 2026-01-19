import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-military-900 mb-6">
        Registro
      </h2>
      
      <div className="text-center py-8">
        <p className="text-military-600 mb-4">
          Página de registro en construcción
        </p>
        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
          Volver al login
        </Link>
      </div>
    </div>
  );
}