import { useEffect, useRef } from "react";
import useGetMessages from "@/hooks/useGetMessages";
import MessageSkeleton from "@/components/skeletons/MessageSkeleton";
import Message from "@/components/messages/Message";
import useConversation from "@/hooks/useConversation";
import useMarkSeen from "@/hooks/useMarkSeen";
import { useSocketContext } from "@/context/SocketContext";

const Messages = () => {
  const { messages, loading } = useGetMessages();
  const { selectedConversation } = useConversation();
  const { typingUsers, recordingUsers } = useSocketContext();
  const { markSeen } = useMarkSeen();
  const lastMessageRef = useRef<HTMLDivElement>(null);

  const currentTyping = selectedConversation ? typingUsers[selectedConversation._id] || {} : {};
  const currentRecording = selectedConversation ? recordingUsers[selectedConversation._id] || {} : {};
  const typingUserNames = Object.values(currentTyping);
  const recordingUserNames = Object.values(currentRecording);

  useEffect(() => {
    setTimeout(() => {
      lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, typingUserNames.length, recordingUserNames.length]);

  useEffect(() => {
    if (messages.length > 0) {
      markSeen();
    }
  }, [selectedConversation?._id, messages.length]); // Mark as seen when switching or when new messages arrive


  return (
    <div className='px-4 flex-1 overflow-auto custom-scrollbar py-4 space-y-4'>
      {!loading &&
        messages.length > 0 &&
        messages.map((message) => (
          <div key={message._id} ref={lastMessageRef}>
            <Message message={message} />
          </div>
        ))}

      {/* Typing/Recording Indicators */}
      {(typingUserNames.length > 0 || recordingUserNames.length > 0) && (
        <div className="flex flex-col gap-1 py-2" ref={lastMessageRef}>
          {typingUserNames.map((name, idx) => (
            <div key={`typing-${idx}`} className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
              </div>
              <span className="font-medium">{name} is typing...</span>
            </div>
          ))}
          {recordingUserNames.map((name, idx) => (
            <div key={`recording-${idx}`} className="flex items-center gap-2 text-xs text-red-400 animate-pulse">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-ping"></div>
              <span className="font-medium">{name} is recording voice...</span>
            </div>
          ))}
        </div>
      )}

      {loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}
      {!loading && messages.length === 0 && (
        <p className='text-center text-gray-400 mt-10'>Send a message to start the conversation</p>
      )}
    </div>
  );
};
export default Messages;
