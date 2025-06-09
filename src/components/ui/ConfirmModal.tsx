import { AlertTriangle, X } from 'lucide-react';
import Button, { ButtonProps } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'primary' | 'danger' | 'warning';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'primary'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  let buttonVariant: ButtonProps['variant'] = 'primary';
  if (variant === 'danger') buttonVariant = 'danger';
  if (variant === 'warning') buttonVariant = 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-start">
          {variant !== 'primary' && (
            <div className="mr-4 flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              {typeof description === 'string' ? <p>{description}</p> : description}
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="ghost" onClick={onClose}>
                {cancelText}
              </Button>
              <Button variant={buttonVariant} onClick={onConfirm}>
                {confirmText}
              </Button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 