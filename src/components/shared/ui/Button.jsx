export const Button = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    disabled = false,
    className = '' 
  }) => {
    const baseStyles = "px-4 py-2 rounded font-medium focus:outline-none transition-colors";
    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      danger: "bg-red-600 text-white hover:bg-red-700"
    };
  
    return (
      <button
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
    );
  };