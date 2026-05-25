import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import io, { Socket } from "socket.io-client";
import { baseUrl } from "@/shared/_services/api_service";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];
  typingUsers: { [key: string]: { [key: string]: string } }; // { conversationId: { userId: userName } }
  recordingUsers: { [key: string]: { [key: string]: string } };
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketContextProvider");
  }
  return context;
};

export const SocketContextProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<{ [key: string]: { [key: string]: string } }>({});
  const [recordingUsers, setRecordingUsers] = useState<{ [key: string]: { [key: string]: string } }>({});
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (authUser) {
      const socket = io(baseUrl, {
        query: {
          userId: authUser._id,
        },
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      setSocket(socket);

      socket.on("getOnlineUsers", (users: string[]) => {
        setOnlineUsers(users);
      });

      // Typing Listeners
      socket.on("userTyping", ({ conversationId, userId, senderName }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [conversationId]: {
            ...(prev[conversationId] || {}),
            [userId]: senderName,
          },
        }));
      });

      socket.on("userStoppedTyping", ({ conversationId, userId }) => {
        setTypingUsers((prev) => {
          const updated = { ...prev };
          if (updated[conversationId]) {
            const users = { ...updated[conversationId] };
            delete users[userId];
            if (Object.keys(users).length === 0) {
              delete updated[conversationId];
            } else {
              updated[conversationId] = users;
            }
          }
          return updated;
        });
      });

      // Recording Listeners
      socket.on("userRecording", ({ conversationId, userId, senderName }) => {
        setRecordingUsers((prev) => ({
          ...prev,
          [conversationId]: {
            ...(prev[conversationId] || {}),
            [userId]: senderName,
          },
        }));
      });

      socket.on("userStoppedRecording", ({ conversationId, userId }) => {
        setRecordingUsers((prev) => {
          const updated = { ...prev };
          if (updated[conversationId]) {
            const users = { ...updated[conversationId] };
            delete users[userId];
            if (Object.keys(users).length === 0) {
              delete updated[conversationId];
            } else {
              updated[conversationId] = users;
            }
          }
          return updated;
        });
      });

      return () => {
        socket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setOnlineUsers([]);
        setTypingUsers({});
        setRecordingUsers({});
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers, recordingUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
