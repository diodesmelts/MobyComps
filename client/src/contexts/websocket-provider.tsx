import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

// Define the WebSocket context structure
type WebSocketContextType = {
  connected: boolean;
  sendMessage: (message: object) => void;
  lastMessage: any;
};

// Create context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  sendMessage: () => {},
  lastMessage: null,
});

// Custom hook to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

// WebSocket Provider component
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Create a function to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create WebSocket URL dynamically based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    // Set up event handlers
    socket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
      
      // Attempt to reconnect after delay
      setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);
        setLastMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }, []);

  // Connect to WebSocket on component mount
  useEffect(() => {
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Function to send messages to the server
  const sendMessage = useCallback((message: object) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message, WebSocket is not connected');
    }
  }, []);

  // Create context value
  const contextValue: WebSocketContextType = {
    connected,
    sendMessage,
    lastMessage,
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};