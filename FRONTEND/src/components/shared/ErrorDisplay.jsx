// src/components/shared/ErrorDisplay.jsx
const ErrorDisplay = ({ 
  title = 'Something went wrong',
  message = 'We encountered an error while loading this page.',
  onRetry 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">😕</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-gray-500 mb-6">{message}</p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;