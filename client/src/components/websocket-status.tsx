import { useWebSocket } from "@/contexts/websocket-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function WebSocketStatus() {
  const { connected, lastMessage, sendMessage } = useWebSocket();
  const [showDetails, setShowDetails] = useState(false);
  
  const handlePing = () => {
    sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
  };
  
  return (
    <div className="flex flex-col space-y-2 p-2 border rounded-md bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-medium">WebSocket:</span>
          <Badge variant={connected ? "success" : "destructive"}>
            {connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePing}
            disabled={!connected}
          >
            Ping Server
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
      </div>
      
      {showDetails && lastMessage && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
          <div className="font-semibold mb-1">Last Message:</div>
          <pre>{JSON.stringify(lastMessage, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}