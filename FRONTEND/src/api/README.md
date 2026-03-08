# API Client Architecture

The API client is split into three main files:

## 1. `config.js` - Core Configuration
- Environment detection
- Base URL configuration
- CSRF token management
- Token management
- Refresh queue
- Client ID generation
- Axios instance creation

## 2. `interceptors.js` - Request/Response Interceptors
- Request interceptor (adds headers, tokens, logging)
- Response interceptor (handles responses, CSRF tokens)
- Error interceptor (handles 401, 403, 404, 429, 5xx errors)
- Token refresh logic

## 3. `index.js` - Main API Client
- Creates and configures the axios instance
- Attaches interceptors
- Exposes convenience methods (get, post, put, patch, delete)
- Provides utility functions

## Usage

```javascript
import api from './api';

// Make API calls
const users = await api.get('/users');
const newUser = await api.post('/users', { name: 'John' });
await api.delete(`/users/${id}`);

// Check auth status
if (api.isAuthenticated()) {
  // do something
}

// Clear auth on logout
api.clearAuth();

// Get environment info
console.log(api.getEnvInfo());