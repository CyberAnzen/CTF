import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL_W;
const WS_URL = BACKEND_URL.replace(/^http(s?)/, "ws$1") + "/ws/leaderboard";

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
  const wsRef = React.useRef(null);
  const reconnectTimerRef = React.useRef(null);
  console.log(leaderboardData);

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    console.log("[WS] Connecting to:", WS_URL);
    const newWs = new WebSocket(WS_URL);
    wsRef.current = newWs;

    newWs.onopen = () => {
      console.log("[WS] Connected to leaderboard");
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
        console.warn("[WS] Invalid message:", err);
      }
    };

    newWs.onclose = () => {
      console.log("[WS] Disconnected. Reconnecting in 2s...");
      setIsConnected(false);
      reconnectTimerRef.current = setTimeout(connect, 2000);
    };

    newWs.onerror = (err) => {
      console.error("[WS] Error:", err);
      setIsConnected(false);
      newWs.close();
    };
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
