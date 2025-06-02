import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { ShieldAlert } from 'lucide-react';

export default function FeatureNotAvailablePage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
      <ShieldAlert className="w-16 h-16 text-yellow-500 mb-6" />
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
        Funcionalidade Não Disponível
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md">
        Esta funcionalidade não está incluída no seu plano atual. Para acessá-la e
        desbloquear todo o potencial da nossa plataforma, por favor, considere fazer um upgrade.
      </p>
      <Button variant="primary" size="lg" asChild>
        <Link to="/planos">Ver Planos</Link>
      </Button>
    </div>
  );
} 