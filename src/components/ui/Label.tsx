import { LabelHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-error-500">*</span>}
      </label>
    );
  }
);

Label.displayName = 'Label';

export default Label;