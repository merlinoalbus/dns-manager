import React from 'react';

export const Input = React.forwardRef(({ 
  className = '',
  type = 'text',
  error,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      <input
        type={type}
        className={`
          w-full
          px-3
          py-2
          border
          rounded-md
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${className}
        `}
        ref={ref}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';