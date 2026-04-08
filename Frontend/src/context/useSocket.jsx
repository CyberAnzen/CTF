import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from "react";

// ✅ Hardcoded for the Cloudflare Tunnel
const WS_URL = "wss://socket.cyberanzen.icu";

const SocketContext = createContext(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [clientCount, setClientCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const connect = useCallback(() => {
    // Clean up existing connection if it exists
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    console.log("[WS] Connecting to:", WS_URL);
    
    try {
      const newWs = new WebSocket(WS_URL);
      wsRef.current = newWs;

      newWs.onopen = () => {
        console.log("[WS] Connected to leaderboard tunnel");
        setIsConnected(true);
      };

      newWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "CLIENT_COUNT") {
            setClientCount(data.totalClients);
          } else if (data.type === "LEADERBOARD_UPDATE" && data.allRanks) {
            setLeaderboardData(data.allRanks);
          }
        } catch (err) {
          console.warn("[WS] Invalid message format:", err);
        }
      };

      newWs.onclose = (event) => {
        setIsConnected(false);
        // Don't log as error if it's a normal closure
        console.log(`[WS] Connection closed (Code: ${event.code}). Reconnecting in 2s...`);
        reconnectTimerRef.current = setTimeout(connect, 2000);
      };

      newWs.onerror = (err) => {
        console.error("[WS] Connection Error:", err);
        setIsConnected(false);
        // onclose will trigger the reconnection logic
      };
    } catch (error) {
      console.error("[WS] Failed to create WebSocket instance:", error);
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, []);

  const reconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (wsRef.current) {
        // Remove listeners before closing to prevent state updates on unmounted component
        wsRef.current.onclose = null; 
        wsRef.current.close();
      }
    };
  }, [connect]);

  const value = {
    leaderboardData,
    clientCount,
    isConnected,
    reconnect,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
