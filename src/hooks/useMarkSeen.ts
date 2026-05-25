import { useState, useCallback } from "react";
import useConversation from "./useConversation";
import { service } from "@/shared/_services/api_service";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const useMarkSeen = () => {
  const [loading, setLoading] = useState(false);
  const { setMessages, selectedConversation } = useConversation();
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);

  const markSeen = useCallback(async () => {
    if (!selectedConversation?._id) return;
    setLoading(true);
    try {
      await service.markSeen(selectedConversation._id);
      
      setMessages((prev) => {
        if (!prev) return [];
        // Mark all messages as seen that were not sent by me
        return prev.map(msg => {
          const msgSenderId = msg.senderId?._id || msg.senderId;
          // If message is not from me and not already seen, mark it as seen
          if (msgSenderId !== authUser?._id && msg.status !== 'seen') {
            return { ...msg, status: 'seen' };
          }
          return msg;
        });
      });

    } catch (error: any) {
      console.error("Error marking messages as seen:", error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation?._id, setMessages]);

  return { markSeen, loading };
};

export default useMarkSeen;
