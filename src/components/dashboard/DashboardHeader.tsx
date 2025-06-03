import Button from '../ui/Button';
import { PlusCircle } from 'lucide-react';

interface DashboardHeaderProps {
  planName: string;
}

export default function DashboardHeader({ planName }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard (Plano {planName})
      </h1>
      <Button variant="primary" className="flex items-center">
        <PlusCircle className="h-4 w-4 mr-2" />
        Nova Transação
      </Button>
    </div>
  );
} 