import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'bg-stone-900 hover:bg-stone-800 text-stone-50 focus:ring-stone-900 shadow-xs active:bg-black',
    secondary: 'bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 focus:ring-stone-400',
    outline: 'border border-stone-300 text-stone-800 hover:bg-stone-100/80 focus:ring-stone-400',
    ghost: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900 focus:ring-stone-300',
    danger: 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-500',
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
