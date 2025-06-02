import { ComponentProps } from 'react';

interface SelectProps extends ComponentProps<'select'> {
  // Propriedades adicionais podem ser adicionadas aqui
}

export default function Select({ className = '', ...props }: SelectProps) {
  return (
    <select
      className={`
        w-full px-3 py-2 rounded-lg border border-gray-200 
        bg-white text-gray-900
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        dark:bg-gray-800 dark:border-gray-700 dark:text-white
        dark:focus:ring-primary-400
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    />
  );
}