// src/components/shared/EmptyState.jsx
import { Link } from 'react-router-dom';

const EmptyState = ({ 
  icon = '📦',
  title = 'Nothing here yet',
  message = 'Content will appear soon',
  actionText,
  actionLink,
  compact = false
}) => {
  return (
    <div className={`text-center ${compact ? 'py-8' : 'py-16'}`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{message}</p>
      
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-block bg-teal-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;