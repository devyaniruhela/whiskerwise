import { HTMLAttributes } from 'react';
import { getBadgeClasses } from '@/lib/design-system';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <span
      className={`${getBadgeClasses(variant)} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
