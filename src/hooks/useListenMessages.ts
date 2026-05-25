import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSocketContext } from "@/context/SocketContext";
import { RootState, AppDispatch } from "@/store/store";
import { 
  addMessage, 
  updateConversationInList, 
  updateMessageStatus,
  removeMessageFromState,
  updateConversationLastMessage 
} from "@/store/chatSlice";
import notificationSound from "@/assets/notification.mp3";
import { service } from "@/shared/_services/api_service";
import { toast } from "sonner";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const dispatch = useDispatch<AppDispatch>();
  const { selectedConversation } = useSelector((state: RootState) => state.chat);
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      const selectedId = selectedConversation?._id ? String(selectedConversation._id) : null;
      const convId = newMessage.conversationId ? String(newMessage.conversationId) : null;
      const senderId = newMessage.senderId?._id ? String(newMessage.senderId._id) : String(newMessage.senderId);

      const isForCurrentConversation = 
        convId === selectedId || 
        (selectedConversation && !selectedConversation.isGroup && (
          senderId === selectedId
        ));


      if (isForCurrentConversation) {
        dispatch(addMessage(newMessage));
        if (newMessage.conversationId) {
          service.markSeen(newMessage.conversationId).catch(err => console.error(err));
        }
      } else {
        // Show notification toast if not current conversation
        const senderName = newMessage.senderId?.name || "New Message";
        toast.info(`${senderName}: ${newMessage.content.length > 30 ? newMessage.content.substring(0, 30) + '...' : newMessage.content}`, {
          description: "New message received",
          action: {
            label: "View",
            onClick: () => {
              // We'd need a way to switch conversation here, but for now just a toast
            }
          }
        });
        
        // Play sound
        const sound = new Audio(notificationSound);
        sound.play().catch(e => console.log("Audio play blocked", e));
      }
      
      // Update conversation list preview and move to top
      dispatch(updateConversationLastMessage({
        conversationId: newMessage.conversationId,
        lastMessage: newMessage,
        incrementUnread: !isForCurrentConversation
      }));
    });

    socket.on("newConversation", (conversation) => {
      dispatch(updateConversationInList(conversation));
      if (conversation.isGroup) {
         toast.success(`You were added to a new group: ${conversation.groupName}`);
      }
    });

    socket.on("updateConversation", (conversation) => {
      dispatch(updateConversationInList(conversation));
    });

    socket.on("messagesSeen", ({ conversationId, userId, participants }: { conversationId: string, userId: string, participants: string[] }) => {
      dispatch(updateMessageStatus({ conversationId, userId, participants }));
    });

    socket.on("messageDeleted", ({ messageId }: { messageId: string }) => {
      dispatch(removeMessageFromState(messageId));
    });

    return () => {
      socket.off("newMessage");
      socket.off("newConversation");
      socket.off("updateConversation");
      socket.off("messagesSeen");
      socket.off("messageDeleted");
    };
  }, [socket, selectedConversation, dispatch, authUser?._id]);
};

export default useListenMessages;

