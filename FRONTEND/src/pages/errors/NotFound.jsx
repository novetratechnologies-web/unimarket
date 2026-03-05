import { Link } from "react-router-dom";
import { FiHome, FiArrowLeft, FiSearch } from "react-icons/fi";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-4 py-8">
      <div className="max-w-md w-full text-center">
        {/* Animated Illustration */}
        <div className="relative mb-8">
          <div className="w-48 h-48 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <div className="text-6xl">🔍</div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-teal-200 rounded-full opacity-50 animate-bounce"></div>
          <div className="absolute -bottom-2 -right-4 w-12 h-12 bg-cyan-200 rounded-full opacity-50 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute top-1/2 -right-8 w-8 h-8 bg-teal-300 rounded-full opacity-30 animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-teal-100">
          {/* Error Code */}
          <div className="mb-6">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              404
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-full mx-auto"></div>
          </div>

          {/* Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              Page Not Found
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Oops! The page you're looking for seems to have wandered off. 
              It might have been moved, deleted, or never existed in the first place.
            </p>
          </div>

          {/* Search Suggestion */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
              <FiSearch className="text-lg" />
              <span className="text-sm font-medium">Quick Tip</span>
            </div>
            <p className="text-sm text-gray-600">
              Try checking the URL for typos or use the search function to find what you need.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FiHome className="text-lg" />
              Back to Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 hover:shadow-md"
            >
              <FiArrowLeft className="text-lg" />
              Go Back
            </button>
          </div>

          {/* Additional Help */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Still lost?{" "}
              <Link 
                to="/contact" 
                className="text-teal-600 hover:text-teal-700 font-medium hover:underline"
              >
                Contact support
              </Link>{" "}
              for help.
            </p>
          </div>
        </div>

        {/* Decorative Bottom */}
        <div className="mt-8 flex justify-center space-x-2">
          {[1, 2, 3, 4, 5].map((dot) => (
            <div
              key={dot}
              className="w-2 h-2 bg-teal-200 rounded-full animate-pulse"
              style={{ animationDelay: `${dot * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}