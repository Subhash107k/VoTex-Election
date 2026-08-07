import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface UseRealTimeSyncProps {
  onRefresh: () => void;
  token?: string;
}

export function useRealTimeSync({ onRefresh, token }: UseRealTimeSyncProps) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = window.location.origin;
    
    socketRef.current = io(socketUrl, {
      auth: {
        token: token || ""
      }
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Listen to various sync events from the server
    socket.on("vote_cast", () => {
      onRefresh();
    });

    socket.on("election_created", () => {
      onRefresh();
    });

    socket.on("election_updated", () => {
      onRefresh();
    });

    socket.on("election_deleted", () => {
      onRefresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [onRefresh, token]);

  return socketRef.current;
}
