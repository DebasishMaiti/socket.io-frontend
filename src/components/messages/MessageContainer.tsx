import { useEffect, useState } from "react";
import useConversation from "@/hooks/useConversation";
import MessageInput from "@/components/messages/MessageInput";
import Messages from "@/components/messages/Messages";
import { MessageSquare, Video, Phone, Info, ArrowLeft } from "lucide-react";
import { useSocketContext } from "@/context/SocketContext";
import GroupInfo from "./GroupInfo";
import UserInfo from "./UserInfo";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { selectConversationDisplayInfo } from "@/store/chatSlice";

const MessageContainer = () => {
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocketContext();
  const displayInfo = useSelector(selectConversationDisplayInfo);

  useEffect(() => {
    // Reset view when conversation changes
    setShowGroupInfo(false);
    setShowUserInfo(false);
  }, [selectedConversation?._id]);

  useEffect(() => {
    // cleanup function (unmounts)
    return () => setSelectedConversation(null);
  }, []); // Empty dependency array to only run on mount/unmount

  if (!selectedConversation || !displayInfo) return <NoChatSelected />;

  const { displayName, displayPic, otherUser, isGroup } = displayInfo;

  const targetIdForOnline = isGroup ? null : (otherUser?._id || selectedConversation?._id);
  const isOnline = !isGroup && targetIdForOnline && onlineUsers.includes(String(targetIdForOnline));

  if (showGroupInfo && isGroup) {
    return <GroupInfo onBack={() => setShowGroupInfo(false)} />;
  }

  if (showUserInfo && !isGroup) {
    return <UserInfo onBack={() => setShowUserInfo(false)} />;
  }

  return (
    <div className='w-full flex flex-col h-full bg-[#121212] relative'>
      <>
        {/* Header */}
        <div className='bg-[#1e1e1e] px-4 py-3 flex items-center justify-between border-b border-white/5 shadow-md z-10'>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedConversation(null)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="relative">
              {displayPic ? (
                <img
                  src={displayPic}
                  alt="avatar"
                  className="w-10 h-10 rounded-full border border-white/20 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full border border-white/20 bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                  {displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {isOnline && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1e1e1e] rounded-full"></span>
              )}
            </div>
            <div className='flex flex-col'>
              <span className='text-white font-bold text-sm leading-tight'>{displayName}</span>
              <span className='text-[10px] text-gray-400'>
                {isGroup ? `${selectedConversation.participants?.length} members` : (isOnline ? "Online" : "Offline")}
              </span>
            </div>
          </div>

          <div className="flex gap-4 text-gray-400">
            <button className="hover:text-white transition-colors"><Phone size={20} /></button>
            <button className="hover:text-white transition-colors"><Video size={20} /></button>
            <button
              onClick={() => {
                if (isGroup) setShowGroupInfo(true);
                else setShowUserInfo(true);
              }}
              className="hover:text-white transition-colors"
              title={isGroup ? "Group Info" : "User Info"}
            >
              <Info size={20} />
            </button>
          </div>
        </div>

        <Messages />
        {isGroup && !selectedConversation.participants?.some((p: any) => (p._id || p) === authUser?._id) ? (
          <div className="px-4 py-4 bg-red-500/10 border-t border-red-500/20 text-center text-red-400 text-sm font-medium">
            You can no longer send messages to this group as you have been removed.
          </div>
        ) : (
          <MessageInput />
        )}
      </>
    </div>
  );
};
export default MessageContainer;

const NoChatSelected = () => {
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  return (
    <div className='flex items-center justify-center w-full h-full'>
      <div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-4'>
        <div className="p-6 bg-blue-500/10 rounded-full animate-pulse">
          <MessageSquare size={64} className="text-blue-500" />
        </div>
        <div className="space-y-1">
          <p className="text-2xl">Welcome 👋 {authUser?.name} ✨</p>
          <p className="text-gray-400 text-base font-normal">Select a chat to start messaging</p>
        </div>
      </div>
    </div>
  );
};
