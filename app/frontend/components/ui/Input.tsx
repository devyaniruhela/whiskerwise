import { InputHTMLAttributes, forwardRef } from 'react';
import { getInputClasses } from '@/lib/design-system';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  state?: 'default' | 'error' | 'success';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ state = 'default', className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`${getInputClasses(state)} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
