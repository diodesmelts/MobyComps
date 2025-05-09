import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the WebSocket context types
interface WebSocketContextType {
  connected: boolean;
  lastMessage: any | null;
  sendMessage: (message: any) => void;
}

// Create the context with default values
const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
  lastMessage: null,
  sendMessage: () => {}
});

// Hook for components to use the WebSocket context
export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log(`Connecting to WebSocket at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    // Connection opened
    ws.addEventListener('open', () => {
      console.log('WebSocket connection established');
      setConnected(true);
      
      // Send initial ping
      ws.send(JSON.stringify({ type: 'ping' }));
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        setLastMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Connection closed
    ws.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    });

    // Connection error
    ws.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    });

    // Set the socket in state
    setSocket(ws);

    // Clean up on unmount
    return () => {
      console.log('Closing WebSocket connection');
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Function to send messages to the server
  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send message');
    }
  };

  // Provide the WebSocket context to child components
  return (
    <WebSocketContext.Provider value={{ connected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};