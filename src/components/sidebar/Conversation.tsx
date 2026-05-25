import { useSocketContext } from "@/context/SocketContext";
import useConversation from "@/hooks/useConversation";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { baseUrl } from "@/shared/_services/api_service";

const Conversation = ({ conversation, lastIdx }: { conversation: any; lastIdx: boolean }) => {
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { selectedConversation, setSelectedConversation } = useConversation();

  const isSelected = selectedConversation?._id === conversation._id;
  const { onlineUsers } = useSocketContext();
  
  const isGroup = conversation.isGroup;
  
  // Find the other user if it's a 1-to-1 conversation
  const otherUser = !isGroup && conversation.participants 
    ? conversation.participants.find((p: any) => p._id !== authUser?._id)
    : null;

  // Resilient display name and pic logic (handles both Conversation and User objects)
  let displayName = isGroup 
    ? conversation.groupName 
    : (otherUser?.name || conversation.name || conversation.fullName);
    
  let displayPic = isGroup 
    ? conversation.groupImage 
    : (otherUser?.profilePic || conversation.profilePic);

  // Online status check: if it's a conversation, check otherUser. If it's a user, check conversation._id.
  const targetIdForOnline = isGroup ? null : (otherUser?._id || conversation._id);
  const isOnline = !isGroup && targetIdForOnline && onlineUsers.includes(String(targetIdForOnline));
  const conversationId = conversation._id;

  return (
    <>
      <div
        className={`flex gap-3 items-center hover:bg-blue-500/20 rounded-xl p-3 cursor-pointer transition-all duration-200 ${
          isSelected ? "bg-blue-500/30 shadow-lg" : ""
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`relative w-12 h-12 rounded-full overflow-hidden border-2 ${isSelected ? 'border-blue-400' : 'border-white/10'} bg-white/5 flex items-center justify-center`}>
          {displayPic ? (
            <img
              src={displayPic && typeof displayPic === 'string' && displayPic.startsWith('/uploads') ? `${baseUrl}${displayPic}` : displayPic}
              alt='avatar'
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-blue-500 font-bold text-xl">
              {displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full shadow-sm" />
          )}
        </div>

        <div className='flex flex-col flex-1'>
          <div className='flex justify-between items-center'>
            <p className={`font-semibold truncate ${isSelected ? "text-white" : "text-gray-300"}`}>
              {displayName}
            </p>
            {isGroup && (
              <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">Group</span>
            )}
          </div>
          <div className="flex justify-between items-center mt-1">
             <p className="text-xs text-gray-500 truncate max-w-[150px]">
               {conversation.lastMessage?.content || "No messages yet"}
             </p>
             {conversation.unreadCount > 0 && (
               <div className="bg-blue-600 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-lg animate-in zoom-in duration-300">
                 {conversation.unreadCount}
               </div>
             )}
          </div>
        </div>
      </div>

      {!lastIdx && <div className='my-1 border-t border-white/5 mx-2' />}
    </>
  );
};
export default Conversation;
