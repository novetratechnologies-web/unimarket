// ============================================
// hooks/useLocalStorage.js
// ============================================
import { useState, useEffect } from 'react';

/**
 * A hook that syncs state with localStorage
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value
 * @returns {[any, Function]} - Stored value and setter function
 */
export function useLocalStorage(key, initialValue) {
  // Get initial value from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue]);

  const setValue = (value) => {
    try {
      // Allow value to be a function for same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error('Error setting localStorage value:', error);
    }
  };

  // Remove item from localStorage
  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * A hook that syncs state with sessionStorage
 * @param {string} key - The sessionStorage key
 * @param {any} initialValue - Initial value
 * @returns {[any, Function]} - Stored value and setter function
 */
export function useSessionStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading from sessionStorage:', error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error('Error writing to sessionStorage:', error);
    }
  }, [key, storedValue]);

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
    } catch (error) {
      console.error('Error setting sessionStorage value:', error);
    }
  };

  const removeValue = () => {
    try {
      window.sessionStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from sessionStorage:', error);
    }
  };

  return [storedValue, setValue, removeValue];
}

/**
 * A hook that provides typed localStorage access
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value
 * @param {Function} schema - Optional validation schema
 * @returns {[any, Function, Object]} - Stored value, setter, and utilities
 */
export function useTypedLocalStorage(key, initialValue, schema = null) {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  // Validate value against schema if provided
  const isValid = schema ? schema(value) : true;

  // Reset to initial value if validation fails
  useEffect(() => {
    if (schema && !isValid) {
      console.warn(`Invalid value for key "${key}", resetting to initial value`);
      setValue(initialValue);
    }
  }, [key, schema, isValid, setValue, initialValue]);

  return [
    value,
    setValue,
    {
      remove: removeValue,
      isValid,
      reset: () => setValue(initialValue)
    }
  ];
}

/**
 * A hook that manages multiple localStorage items
 * @param {Object} initialValues - Object with key-value pairs
 * @returns {Object} - Object with values and setters
 */
export function useLocalStorageObject(initialValues = {}) {
  const storage = {};

  Object.entries(initialValues).forEach(([key, initialValue]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useLocalStorage(key, initialValue);
    storage[key] = {
      value,
      setValue,
      clear: () => setValue(initialValue)
    };
  });

  // Bulk operations
  const setMultiple = (updates) => {
    Object.entries(updates).forEach(([key, value]) => {
      if (storage[key]) {
        storage[key].setValue(value);
      }
    });
  };

  const clearAll = () => {
    Object.values(storage).forEach(item => item.clear());
  };

  return {
    ...storage,
    setMultiple,
    clearAll,
    getAll: () => {
      const result = {};
      Object.entries(storage).forEach(([key, item]) => {
        result[key] = item.value;
      });
      return result;
    }
  };
}

/**
 * A hook that provides localStorage with expiration
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Initial value
 * @param {number} ttl - Time to live in milliseconds
 * @returns {[any, Function]} - Stored value and setter
 */
export function useLocalStorageWithExpiry(key, initialValue, ttl = 3600000) { // Default: 1 hour
  const getInitialValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);
      if (parsed.expiry && Date.now() > parsed.expiry) {
        window.localStorage.removeItem(key);
        return initialValue;
      }

      return parsed.value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(getInitialValue);

  useEffect(() => {
    try {
      const item = {
        value: storedValue,
        expiry: Date.now() + ttl
      };
      window.localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, [key, storedValue, ttl]);

  const setValue = (value) => {
    setStoredValue(value);
  };

  return [storedValue, setValue];
}

/**
 * A hook that listens for localStorage changes across tabs
 * @param {string} key - The localStorage key to listen to
 * @returns {any} - The current value
 */
export function useLocalStorageSync(key) {
  const [value, setValue] = useLocalStorage(key, null);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, setValue]);

  return value;
}

/**
 * Hook for managing user preferences in localStorage
 * @param {string} key - Storage key
 * @param {Object} defaultPrefs - Default preferences
 * @returns {Object} - Preferences and setters
 */
export function usePreferences(key = 'user-preferences', defaultPrefs = {}) {
  const [prefs, setPrefs, removePrefs] = useTypedLocalStorage(key, defaultPrefs);

  const updatePreference = (name, value) => {
    setPrefs(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const updatePreferences = (newPrefs) => {
    setPrefs(prev => ({
      ...prev,
      ...newPrefs
    }));
  };

  const resetPreference = (name) => {
    setPrefs(prev => ({
      ...prev,
      [name]: defaultPrefs[name]
    }));
  };

  const resetAllPreferences = () => {
    setPrefs(defaultPrefs);
  };

  return {
    preferences: prefs,
    updatePreference,
    updatePreferences,
    resetPreference,
    resetAllPreferences,
    remove: removePrefs
  };
}

/**
 * Hook for managing recent searches in localStorage
 * @param {number} maxItems - Maximum number of searches to store
 * @returns {Object} - Recent searches and functions
 */
export function useRecentSearches(maxItems = 10) {
  const [searches, setSearches] = useLocalStorage('recent-searches', []);

  const addSearch = (query) => {
    if (!query.trim()) return;

    setSearches(prev => {
      // Remove if already exists
      const filtered = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
      // Add to beginning and limit
      return [query, ...filtered].slice(0, maxItems);
    });
  };

  const removeSearch = (query) => {
    setSearches(prev => prev.filter(s => s.toLowerCase() !== query.toLowerCase()));
  };

  const clearAll = () => {
    setSearches([]);
  };

  return {
    searches,
    addSearch,
    removeSearch,
    clearAll
  };
}

// Example usage component (commented out to avoid JSX in .js file)
/*
export const LocalStorageExample = () => {
  // Basic usage
  const [name, setName] = useLocalStorage('name', 'John Doe');

  // With expiry
  const [token, setToken] = useLocalStorageWithExpiry('auth-token', null, 3600000);

  // Recent searches
  const { searches, addSearch, removeSearch, clearAll } = useRecentSearches(5);

  // Preferences
  const { preferences, updatePreference, resetAllPreferences } = usePreferences('app-preferences', {
    theme: 'light',
    fontSize: 'medium',
    notifications: true
  });

  return (
    <div>
      <h2>LocalStorage Examples</h2>
      
      <div>
        <h3>Basic Storage</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
        <p>Stored name: {name}</p>
      </div>

      <div>
        <h3>Recent Searches</h3>
        <input
          type="text"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addSearch(e.target.value);
              e.target.value = '';
            }
          }}
          placeholder="Search and press Enter"
        />
        <ul>
          {searches.map((search, index) => (
            <li key={index}>
              {search}
              <button onClick={() => removeSearch(search)}>Remove</button>
            </li>
          ))}
        </ul>
        {searches.length > 0 && <button onClick={clearAll}>Clear All</button>}
      </div>
    </div>
  );
};
*/

export default useLocalStorage;