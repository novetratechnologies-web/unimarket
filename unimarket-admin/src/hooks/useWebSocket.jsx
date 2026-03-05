// hooks/useWebSocket.js - FIXED VERSION
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useWebSocket = () => {
  const { token, user } = useAuth();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  const connect = useCallback(() => {
    // Don't connect if no token or already connecting/connected
    if (!token || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
    console.log('🔌 Connecting to WebSocket...');
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected');
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
      
      // Send subscription based on user role
      if (user?.role === 'admin' || user?.role === 'super_admin') {
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'admin' }));
      } else if (user?.role === 'vendor') {
        ws.send(JSON.stringify({ type: 'subscribe', channel: 'vendor' }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📩 WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          case 'connection':
            console.log('🔄 Connection established:', data.message);
            break;
          default:
            // Dispatch custom event for other components to listen to
            window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = (event) => {
      console.log(`❌ WebSocket disconnected: ${event.code} - ${event.reason}`);
      wsRef.current = null;

      // Implement exponential backoff reconnection
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`🔄 Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${MAX_RECONNECT_ATTEMPTS})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, delay);
      } else {
        console.log('❌ Max reconnection attempts reached');
      }
    };
  }, [token, user]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect when token changes
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Send message function
  const sendMessage = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  return {
    sendMessage,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect
  };
};