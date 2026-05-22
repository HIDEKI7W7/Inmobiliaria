import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline';
};

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', className = '', ...props }) => {
  const baseStyles = "px-6 py-2 rounded-lg font-bold transition-all duration-200";
  const variants = {
    primary: "bg-propio-blue text-white hover:bg-blue-900 focus:ring-2 focus:ring-propio-green",
    secondary: "bg-propio-green text-propio-blue hover:bg-lime-300 focus:ring-2 focus:ring-propio-blue",
    outline: "border-2 border-propio-blue text-propio-blue hover:bg-propio-blue hover:text-white"
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props} 
    />
  );
};
