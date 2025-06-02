import { ComponentProps, forwardRef } from 'react';

export interface InputProps extends ComponentProps<'input'> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className = '', error, ...props }, ref) => {
  return (
    <div className="w-full">
      <input
        ref={ref}
        className={`
          w-full px-3 py-2 rounded-lg border
          ${error 
            ? 'border-error-300 focus:ring-error-500 dark:border-error-700 dark:focus:ring-error-400' 
            : 'border-gray-200 focus:ring-primary-500 dark:border-gray-700 dark:focus:ring-primary-400'
          }
          bg-white text-gray-900 placeholder-gray-500
          focus:outline-none focus:ring-2 focus:border-transparent
          dark:bg-gray-800 dark:text-white dark:placeholder-gray-400
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;