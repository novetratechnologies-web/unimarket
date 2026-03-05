// ============================================
// hooks/useDebounce.js
// ============================================
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A hook that debounces a value
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set debouncedValue to value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes or unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * A hook that debounces a function
 * @param {Function} fn - The function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function useDebouncedCallback(fn, delay = 500, deps = []) {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [delay, ...deps]);
}

/**
 * A hook that debounces a promise-returning function
 * @param {Function} fn - The async function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced async function
 */
export function useDebouncedAsync(fn, delay = 500, deps = []) {
  const timeoutRef = useRef(null);
  const pendingPromiseRef = useRef(null);

  return useCallback((...args) => {
    // Cancel previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous pending promise
    if (pendingPromiseRef.current) {
      pendingPromiseRef.current.cancel?.();
    }

    // Create a new promise that will be resolved after delay
    const promise = new Promise((resolve, reject) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          pendingPromiseRef.current = null;
        }
      }, delay);
    });

    // Add cancel method to promise
    promise.cancel = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      pendingPromiseRef.current = null;
    };

    pendingPromiseRef.current = promise;
    return promise;
  }, [delay, ...deps]);
}

/**
 * A hook that debounces state updates
 * @param {any} initialState - Initial state
 * @param {number} delay - Delay in milliseconds
 * @returns {Array} [state, setState, debouncedState]
 */
export function useDebouncedState(initialState, delay = 500) {
  const [state, setState] = useState(initialState);
  const [debouncedState, setDebouncedState] = useState(initialState);
  const timeoutRef = useRef(null);

  const setDebounced = useCallback((newValue) => {
    setState(newValue);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedState(newValue);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setDebounced, debouncedState];
}

/**
 * A hook that debounces form input
 * @param {any} initialValue - Initial input value
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} Input props and debounced value
 */
export function useDebouncedInput(initialValue = '', delay = 500) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [isTyping, setIsTyping] = useState(false);
  const timeoutRef = useRef(null);

  const handleChange = useCallback((e) => {
    const value = e.target?.value ?? e;
    setInputValue(value);
    setIsTyping(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      setIsTyping(false);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setInputValue(initialValue);
    setDebouncedValue(initialValue);
    setIsTyping(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [initialValue]);

  return {
    value: inputValue,
    debouncedValue,
    isTyping,
    onChange: handleChange,
    setValue: setInputValue,
    reset
  };
}

/**
 * A hook that debounces search queries
 * @param {Function} searchFn - Search function to call
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Additional options
 * @returns {Object} Search state and functions
 */
export function useDebouncedSearch(searchFn, delay = 500, options = {}) {
  const {
    minLength = 2,
    onError,
    onSuccess
  } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debouncedQuery = useDebounce(query, delay);

  useEffect(() => {
    const performSearch = async () => {
      // Don't search if query is too short
      if (debouncedQuery.length < minLength) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await searchFn(debouncedQuery);
        setResults(data);
        onSuccess?.(data);
      } catch (err) {
        setError(err.message);
        onError?.(err);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchFn, minLength, onSuccess, onError]);

  const handleQueryChange = useCallback((e) => {
    setQuery(e.target?.value ?? e);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    results,
    loading,
    error,
    debouncedQuery,
    setQuery: handleQueryChange,
    clearSearch
  };
}

// ============================================
// Example usage component
// ============================================
export const DebounceExample = () => {
  // Basic value debouncing
  const [input, setInput] = useState('');
  const debouncedInput = useDebounce(input, 500);

  // Debounced callback
  const debouncedSave = useDebouncedCallback((value) => {
    console.log('Saving:', value);
    // API call here
  }, 1000);

  // Debounced search
  const {
    query,
    results,
    loading,
    setQuery,
    clearSearch
  } = useDebouncedSearch(async (q) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: 1, name: `Result for ${q} 1` },
      { id: 2, name: `Result for ${q} 2` }
    ];
  }, 500);

  // Debounced input
  const {
    value: formValue,
    debouncedValue: debouncedFormValue,
    isTyping,
    onChange: handleFormChange,
    reset: resetForm
  } = useDebouncedInput('', 300);

  return (
    <div className="space-y-6 p-4">
      {/* Basic debounce example */}
      <div className="space-y-2">
        <h3 className="font-medium">Basic Debounce</h3>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            debouncedSave(e.target.value);
          }}
          placeholder="Type something..."
          className="px-3 py-2 border rounded-lg"
        />
        <p className="text-sm text-gray-600">
          Immediate: {input || 'Empty'}
        </p>
        <p className="text-sm text-gray-600">
          Debounced (500ms): {debouncedInput || 'Empty'}
        </p>
      </div>

      {/* Search example */}
      <div className="space-y-2">
        <h3 className="font-medium">Debounced Search</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={setQuery}
            placeholder="Search (min 2 chars)..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={clearSearch}
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
        
        {loading && (
          <div className="text-sm text-gray-500">Searching...</div>
        )}
        
        {results.length > 0 && (
          <ul className="space-y-1">
            {results.map(result => (
              <li key={result.id} className="text-sm p-2 bg-gray-50 rounded">
                {result.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form input example */}
      <div className="space-y-2">
        <h3 className="font-medium">Debounced Form Input</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={formValue}
            onChange={handleFormChange}
            placeholder="Type to see debounce..."
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button
            onClick={resetForm}
            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Reset
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {isTyping && (
            <span className="text-xs text-yellow-600 animate-pulse">
              Typing...
            </span>
          )}
        </div>
        
        <p className="text-sm text-gray-600">
          Debounced value (300ms): {debouncedFormValue || 'Empty'}
        </p>
      </div>
    </div>
  );
};

export default useDebounce;