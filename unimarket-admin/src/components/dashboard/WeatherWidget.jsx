// components/dashboard/WeatherWidget.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Wind,
  Droplets,
  Eye,
  Compass,
  Sunrise,
  Sunset,
  Thermometer,
  MapPin,
  RefreshCw,
  AlertCircle,
  Moon,
  Stars,
  CloudFog,
  CloudHail,
  Cloudy,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';

// ============================================
// CONSTANTS
// ============================================
const WEATHER_CONDITIONS = {
  'clear-day': { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-100', label: 'Clear Sky' },
  'clear-night': { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-100', label: 'Clear Night' },
  'cloudy': { icon: Cloud, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Cloudy' },
  'partly-cloudy-day': { icon: Cloudy, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Partly Cloudy' },
  'partly-cloudy-night': { icon: Cloud, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Partly Cloudy' },
  'rain': { icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-100', label: 'Rain' },
  'snow': { icon: CloudSnow, color: 'text-blue-300', bg: 'bg-blue-50', label: 'Snow' },
  'sleet': { icon: CloudHail, color: 'text-blue-400', bg: 'bg-blue-100', label: 'Sleet' },
  'wind': { icon: Wind, color: 'text-teal-500', bg: 'bg-teal-100', label: 'Windy' },
  'fog': { icon: CloudFog, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Fog' },
  'thunderstorm': { icon: CloudLightning, color: 'text-purple-500', bg: 'bg-purple-100', label: 'Thunderstorm' },
  'drizzle': { icon: CloudDrizzle, color: 'text-blue-400', bg: 'bg-blue-100', label: 'Drizzle' }
};

const ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 }
};

// ============================================
// WEATHER WIDGET COMPONENT
// ============================================
const WeatherWidget = ({
  location = 'New York, NY',
  units = 'metric',
  showDetails = true,
  showForecast = true,
  showLocation = true,
  autoRefresh = true,
  refreshInterval = 30 * 60 * 1000, // 30 minutes
  onWeatherUpdate,
  className = '',
  size = 'md' // sm, md, lg
}) => {
  const { showToast } = useToast();
  
  // State
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [airQuality, setAirQuality] = useState(null);

  // ============================================
  // FETCH WEATHER DATA
  // ============================================
  const fetchWeather = useCallback(async (searchLocation = location) => {
    setIsRefreshing(true);
    setError(null);

    try {
      // In production, replace with your actual weather API
      // Example: OpenWeatherMap, WeatherAPI, etc.
      const mockWeather = generateMockWeather(searchLocation);
      const mockForecast = generateMockForecast();
      const mockAlerts = generateMockAlerts();
      const mockAirQuality = generateMockAirQuality();

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setWeather(mockWeather);
      setForecast(mockForecast);
      setAlerts(mockAlerts);
      setAirQuality(mockAirQuality);
      setLastUpdated(new Date());
      
      if (onWeatherUpdate) {
        onWeatherUpdate({ weather: mockWeather, forecast: mockForecast });
      }
    } catch (err) {
      console.error('Failed to fetch weather:', err);
      setError('Unable to load weather data');
      showToast({
        title: 'Weather Update Failed',
        description: 'Please try again later',
        type: 'error'
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [location, onWeatherUpdate, showToast]);

  // ============================================
  // INITIAL FETCH AND AUTO-REFRESH
  // ============================================
  useEffect(() => {
    fetchWeather();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchWeather();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [fetchWeather, autoRefresh, refreshInterval]);

  // ============================================
  // HANDLE LOCATION SEARCH
  // ============================================
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLocation(searchQuery);
    await fetchWeather(searchQuery);
    setSearchQuery('');
    setShowSearch(false);
  };

  // ============================================
  // GET WEATHER ICON AND COLOR
  // ============================================
  const getWeatherInfo = (condition) => {
    return WEATHER_CONDITIONS[condition] || WEATHER_CONDITIONS['clear-day'];
  };

  // ============================================
  // GET AIR QUALITY DESCRIPTION
  // ============================================
  const getAirQualityDescription = (index) => {
    if (index <= 50) return { text: 'Good', color: 'text-green-600', bg: 'bg-green-100' };
    if (index <= 100) return { text: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (index <= 150) return { text: 'Unhealthy for Sensitive', color: 'text-orange-600', bg: 'bg-orange-100' };
    if (index <= 200) return { text: 'Unhealthy', color: 'text-red-600', bg: 'bg-red-100' };
    if (index <= 300) return { text: 'Very Unhealthy', color: 'text-purple-600', bg: 'bg-purple-100' };
    return { text: 'Hazardous', color: 'text-rose-600', bg: 'bg-rose-100' };
  };

  // ============================================
  // SIZE STYLES
  // ============================================
  const sizeStyles = {
    sm: {
      container: 'p-4',
      icon: 'h-12 w-12',
      temp: 'text-2xl',
      city: 'text-sm',
      details: 'text-xs'
    },
    md: {
      container: 'p-6',
      icon: 'h-16 w-16',
      temp: 'text-3xl',
      city: 'text-base',
      details: 'text-sm'
    },
    lg: {
      container: 'p-8',
      icon: 'h-20 w-20',
      temp: 'text-4xl',
      city: 'text-lg',
      details: 'text-base'
    }
  };

  const styles = sizeStyles[size];

  // ============================================
  // RENDER LOADING STATE
  // ============================================
  if (loading) {
    return (
      <motion.div
        variants={ANIMATION_VARIANTS}
        initial="hidden"
        animate="visible"
        className={`bg-white rounded-2xl border border-gray-200 shadow-sm ${styles.container} ${className}`}
      >
        <div className="animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-6 w-32 bg-gray-300 rounded"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============================================
  // RENDER ERROR STATE
  // ============================================
  if (error || !weather) {
    return (
      <motion.div
        variants={ANIMATION_VARIANTS}
        initial="hidden"
        animate="visible"
        className={`bg-white rounded-2xl border border-red-200 shadow-sm ${styles.container} ${className}`}
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Weather Unavailable</h3>
          <p className="text-xs text-gray-600 mb-3">{error || 'Unable to load weather data'}</p>
          <button
            onClick={() => fetchWeather()}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-xl hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.condition);
  const WeatherIcon = weatherInfo.icon;
  const airQualityInfo = getAirQualityDescription(airQuality?.index || 0);

  return (
    <motion.div
      variants={ANIMATION_VARIANTS}
      initial="hidden"
      animate="visible"
      className={`bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 shadow-sm overflow-hidden ${className}`}
    >
      {/* Main Weather Display */}
      <div className={styles.container}>
        {/* Header with location and refresh */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {showLocation && (
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{weather.location}</span>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="ml-2 p-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <span className="text-xs text-primary-600">Change</span>
                </button>
              </div>
            )}
            
            {/* Location Search */}
            <AnimatePresence>
              {showSearch && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={handleSearch}
                  className="mb-3 overflow-hidden"
                >
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter city name..."
                      className="flex-1 px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="flex items-baseline gap-2">
              <span className={`font-bold ${styles.temp}`}>{weather.temperature}°</span>
              <span className="text-gray-600 text-sm">{weatherInfo.label}</span>
            </div>
          </div>

          {/* Weather Icon */}
          <div className="relative">
            <div className={`${weatherInfo.bg} rounded-2xl p-3`}>
              <WeatherIcon className={`${styles.icon} ${weatherInfo.color}`} />
            </div>
            
            {/* Refresh indicator */}
            <button
              onClick={() => fetchWeather()}
              disabled={isRefreshing}
              className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md hover:shadow-lg transition-all"
              title="Refresh weather"
            >
              <RefreshCw className={`h-3 w-3 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Weather Details */}
        {showDetails && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Thermometer className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className={`text-gray-500 ${styles.details}`}>Feels like</p>
                <p className={`font-semibold text-gray-900 ${styles.details}`}>{weather.feelsLike}°</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Droplets className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className={`text-gray-500 ${styles.details}`}>Humidity</p>
                <p className={`font-semibold text-gray-900 ${styles.details}`}>{weather.humidity}%</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wind className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className={`text-gray-500 ${styles.details}`}>Wind</p>
                <p className={`font-semibold text-gray-900 ${styles.details}`}>{weather.windSpeed} {units === 'metric' ? 'km/h' : 'mph'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Eye className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className={`text-gray-500 ${styles.details}`}>Visibility</p>
                <p className={`font-semibold text-gray-900 ${styles.details}`}>{weather.visibility} km</p>
              </div>
            </div>
          </div>
        )}

        {/* Air Quality */}
        {airQuality && (
          <div className="mt-4 p-3 bg-white/50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Air Quality Index</span>
              <span className={`text-xs px-2 py-1 rounded-full ${airQualityInfo.bg} ${airQualityInfo.color}`}>
                {airQualityInfo.text}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(airQuality.index / 300) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150</span>
              <span>200</span>
              <span>300+</span>
            </div>
          </div>
        )}

        {/* Weather Alerts */}
        {alerts.length > 0 && (
          <div className="mt-4 space-y-2">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 border border-red-200 rounded-xl"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{alert.title}</p>
                    <p className="text-xs text-red-600 mt-1">{alert.description}</p>
                    <p className="text-xs text-red-500 mt-1">
                      Until {format(new Date(alert.until), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forecast */}
      {showForecast && forecast.length > 0 && (
        <div className="border-t border-blue-100 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">7-Day Forecast</h4>
          <div className="grid grid-cols-7 gap-2">
            {forecast.map((day, index) => {
              const dayInfo = getWeatherInfo(day.condition);
              const DayIcon = dayInfo.icon;
              const isSelected = selectedDay === index;

              return (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDay(isSelected ? null : index)}
                  className={`text-center p-2 rounded-xl transition-all ${
                    isSelected ? 'bg-blue-100 shadow-inner' : 'hover:bg-white/50'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    {format(new Date(day.date), 'EEE')}
                  </p>
                  <DayIcon className={`h-6 w-6 mx-auto mb-1 ${dayInfo.color}`} />
                  <p className="text-sm font-semibold text-gray-900">{day.temp}°</p>
                  <p className="text-xs text-gray-500">{day.precipitation}%</p>
                  
                  {/* Expanded details on click */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-blue-200 overflow-hidden"
                      >
                        <div className="space-y-1 text-xs">
                          <p className="flex justify-between">
                            <span className="text-gray-500">High:</span>
                            <span className="font-medium">{day.high}°</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Low:</span>
                            <span className="font-medium">{day.low}°</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Wind:</span>
                            <span className="font-medium">{day.wind} km/h</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-gray-500">Humidity:</span>
                            <span className="font-medium">{day.humidity}%</span>
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-gray-500">
            Updated {format(lastUpdated, 'h:mm a')}
          </p>
        </div>
      )}
    </motion.div>
  );
};

// ============================================
// MINI WEATHER WIDGET (Compact version)
// ============================================
export const MiniWeatherWidget = ({ location = 'New York, NY', className = '' }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      setWeather(generateMockWeather(location));
      setLoading(false);
    };
    fetchWeather();
  }, [location]);

  if (loading || !weather) {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-3 animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const weatherInfo = getWeatherInfo(weather.condition);
  const WeatherIcon = weatherInfo.icon;

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`${weatherInfo.bg} rounded-lg p-2`}>
          <WeatherIcon className={`h-6 w-6 ${weatherInfo.color}`} />
        </div>
        <div>
          <p className="text-xs text-gray-600">{weather.location}</p>
          <p className="text-lg font-bold text-gray-900">{weather.temperature}°C</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// WEATHER DETAILS CARD (Detailed version)
// ============================================
export const WeatherDetailsCard = ({ weather, className = '' }) => {
  if (!weather) return null;

  const weatherInfo = getWeatherInfo(weather.condition);
  const WeatherIcon = weatherInfo.icon;

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weather Details</h3>
            <p className="text-sm text-gray-600">{weather.location}</p>
          </div>
          <div className={`${weatherInfo.bg} rounded-2xl p-4`}>
            <WeatherIcon className={`h-12 w-12 ${weatherInfo.color}`} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl">
            <Thermometer className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Temperature</p>
            <p className="text-xl font-bold text-gray-900">{weather.temperature}°C</p>
            <p className="text-xs text-gray-500">Feels like {weather.feelsLike}°C</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Droplets className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Humidity</p>
            <p className="text-xl font-bold text-gray-900">{weather.humidity}%</p>
            <p className="text-xs text-gray-500">Dew point {weather.dewPoint}°C</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Wind className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Wind</p>
            <p className="text-xl font-bold text-gray-900">{weather.windSpeed} km/h</p>
            <p className="text-xs text-gray-500">Gusts {weather.windGust} km/h</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Eye className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Visibility</p>
            <p className="text-xl font-bold text-gray-900">{weather.visibility} km</p>
            <p className="text-xs text-gray-500">Clear</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Sunrise className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Sunrise</p>
            <p className="text-xl font-bold text-gray-900">{weather.sunrise}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Sunset className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Sunset</p>
            <p className="text-xl font-bold text-gray-900">{weather.sunset}</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Compass className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Pressure</p>
            <p className="text-xl font-bold text-gray-900">{weather.pressure} hPa</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <Cloud className="h-5 w-5 text-gray-600 mb-2" />
            <p className="text-sm text-gray-600">Cloud Cover</p>
            <p className="text-xl font-bold text-gray-900">{weather.cloudCover}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HELPER FUNCTIONS - Mock Data Generators
// ============================================
const generateMockWeather = (location) => {
  const conditions = Object.keys(WEATHER_CONDITIONS);
  const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
  
  return {
    location,
    condition: randomCondition,
    temperature: Math.floor(Math.random() * 35) + 5,
    feelsLike: Math.floor(Math.random() * 33) + 7,
    humidity: Math.floor(Math.random() * 60) + 30,
    windSpeed: Math.floor(Math.random() * 30) + 5,
    windGust: Math.floor(Math.random() * 40) + 10,
    visibility: Math.floor(Math.random() * 10) + 5,
    pressure: Math.floor(Math.random() * 30) + 1000,
    cloudCover: Math.floor(Math.random() * 100),
    dewPoint: Math.floor(Math.random() * 15) + 5,
    uvIndex: Math.floor(Math.random() * 11),
    sunrise: '6:45 AM',
    sunset: '7:30 PM'
  };
};

const generateMockForecast = () => {
  const conditions = Object.keys(WEATHER_CONDITIONS);
  const forecast = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    forecast.push({
      date: date.toISOString(),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      temp: Math.floor(Math.random() * 30) + 10,
      high: Math.floor(Math.random() * 32) + 12,
      low: Math.floor(Math.random() * 20) + 5,
      precipitation: Math.floor(Math.random() * 60),
      wind: Math.floor(Math.random() * 25) + 5,
      humidity: Math.floor(Math.random() * 60) + 30
    });
  }

  return forecast;
};

const generateMockAlerts = () => {
  if (Math.random() > 0.7) {
    return [
      {
        title: 'Severe Thunderstorm Warning',
        description: 'Strong thunderstorms expected in your area. Seek shelter immediately.',
        until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
  return [];
};

const generateMockAirQuality = () => {
  return {
    index: Math.floor(Math.random() * 200),
    pm25: Math.floor(Math.random() * 50),
    pm10: Math.floor(Math.random() * 80),
    o3: Math.floor(Math.random() * 100),
    no2: Math.floor(Math.random() * 40)
  };
};

export default WeatherWidget;