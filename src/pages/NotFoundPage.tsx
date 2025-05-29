import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-primary-600 dark:text-primary-400">404</h1>
        <h2 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Página não encontrada</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center">
          <Button
            variant="outline"
            className="flex items-center justify-center"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
          <Link to="/">
            <Button className="w-full sm:w-auto flex items-center justify-center">
              <Home className="h-5 w-5 mr-2" />
              Ir para a página inicial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}