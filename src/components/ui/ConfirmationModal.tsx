import React from 'react';
import { X, AlertTriangle } from 'lucide-react'; // Usar AlertTriangle para ações destrutivas
import Button, { ButtonProps } from './Button'; // Importando ButtonProps

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | React.ReactNode;
  confirmButtonText?: string;
  cancelButtonText?: string;
  // Usar as variantes válidas do nosso componente Button, mapeando 'destructive' para 'danger'
  confirmButtonIntent?: 'primary' | 'destructive' | 'secondary' | 'success' | 'warning' | 'outline' | 'ghost'; 
  isConfirmDisabled?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  confirmButtonIntent = 'primary',
  isConfirmDisabled = false
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  // Mapear a intenção para a variante real do botão
  let actualButtonVariant: ButtonProps['variant'] = 'primary';
  switch (confirmButtonIntent) {
    case 'destructive':
      actualButtonVariant = 'danger';
      break;
    case 'primary':
    case 'secondary':
    case 'success':
    case 'warning':
    case 'outline':
    case 'ghost':
      actualButtonVariant = confirmButtonIntent;
      break;
    default:
      actualButtonVariant = 'primary';
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start">
          {/* Mostrar ícone de alerta se a intenção for destrutiva (mapeada para danger) */}
          {confirmButtonIntent === 'destructive' && (
            <div className="mr-4 flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
          )}
          <div className="w-full">
            <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="ghost" onClick={onClose}>
            {cancelButtonText}
          </Button>
          <Button 
            variant={actualButtonVariant} 
            onClick={onConfirm} 
            disabled={isConfirmDisabled}
          >
            {confirmButtonText}
          </Button>
        </div>
      </div>
    </div>
  );
} 