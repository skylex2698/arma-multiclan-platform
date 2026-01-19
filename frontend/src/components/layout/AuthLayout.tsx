import { Outlet } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-military-900 via-military-800 to-military-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Arma Events Platform
          </h1>
          <p className="text-military-300">
            Gestión de eventos multiclan
          </p>
        </div>
        
        <div className="card">
          <Outlet />
        </div>
        
        <p className="text-center text-military-400 text-sm mt-4">
          &copy; 2026 Arma Events Platform. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}