import useConversation from "@/hooks/useConversation";
import { formatTime } from "@/utils/extractTime";
import { Check, CheckCheck, FileText, Download, ExternalLink, MoreVertical, Trash2, UserX } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteMessage } from "@/store/chatSlice";
import { AppDispatch, RootState } from "@/store/store";
import ConfirmationModal from "../shared/ConfirmationModal";
import { baseUrl } from "@/shared/_services/api_service";

const Message = ({ message }: { message: any }) => {
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { selectedConversation } = useConversation();
  const dispatch = useDispatch<AppDispatch>();
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<"me" | "everyone" | null>(null);
  
  const sender = typeof message.senderId === 'object' ? message.senderId : { _id: message.senderId };
  const fromMe = sender._id === authUser?._id;
  
  const formattedTime = formatTime(message.createdAt);
  const chatClassName = fromMe ? "flex-row-reverse" : "flex-row";
  
  const isGroup = selectedConversation?.isGroup;
  
  // Use populated sender data if available
  const profilePic = fromMe 
    ? authUser.profilePic 
    : (sender.profilePic || selectedConversation?.profilePic);

  const handleDelete = async () => {
    if (showDeleteModal) {
      dispatch(deleteMessage(message._id, showDeleteModal));
      setShowDeleteModal(null);
      setShowOptions(false);
    }
  };
  
  const isOnlyEmojis = (text: string) => {
    if (!text) return false;
    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/g;
    return emojiRegex.test(text.replace(/\s/g, ''));
  };

  const isEmojiOnly = message.messageType === 'text' && isOnlyEmojis(message.content);

  const bubbleBgColor = isEmojiOnly 
    ? "bg-transparent border-none shadow-none" 
    : (fromMe ? "bg-blue-600 text-white" : "bg-white/10 text-gray-200");

  const renderStatus = () => {
    if (!fromMe) return null;
    
    switch (message.status) {
      case 'sent':
        return <Check size={14} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={14} className="text-gray-400" />;
      case 'seen':
        return <CheckCheck size={14} className="text-blue-400" />;
      default:
        return <Check size={14} className="text-gray-400" />;
    }
  };

  const renderContent = () => {
    switch (message.messageType) {
      case 'voice':
        return (
          <div className="py-1 min-w-[200px]">
            <audio 
              src={`${baseUrl}${message.fileUrl || message.audioUrl}`} 
              controls 
              className="h-8 w-full filter invert brightness-200"
            />
          </div>
        );
      case 'image':
        return (
          <div className="relative group cursor-pointer overflow-hidden rounded-lg">
            <img 
              src={`${baseUrl}${message.fileUrl}`} 
              alt="Sent photo" 
              className="max-w-full max-h-72 object-cover rounded-lg hover:scale-[1.02] transition-transform"
              onClick={() => window.open(`${baseUrl}${message.fileUrl}`, '_blank')}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ExternalLink size={24} className="text-white" />
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="relative max-w-full max-h-72 bg-black rounded-lg overflow-hidden">
            <video 
              src={`${baseUrl}${message.fileUrl}`} 
              controls 
              className="max-w-full max-h-72"
            />
          </div>
        );
      case 'file':
        return (
          <a 
            href={`${baseUrl}${message.fileUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2 bg-black/20 hover:bg-black/30 rounded-xl transition-colors min-w-[200px]"
          >
            <div className="p-3 bg-orange-500/20 text-orange-500 rounded-xl">
              <FileText size={24} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{message.fileName || "Document"}</p>
              <p className="text-[10px] text-gray-400 uppercase">
                {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(2)} MB` : "File"}
              </p>
            </div>
            <Download size={18} className="text-gray-400" />
          </a>
        );
      default:
        return (
          <span className={`${isEmojiOnly ? 'text-5xl leading-tight' : ''}`}>
            {message.content}
          </span>
        );
    }
  };

  return (
    <div className={`flex items-end gap-2 ${chatClassName} mb-1 group relative`}>
      <div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-white/5'>
        <img 
          alt='avatar' 
          src={profilePic?.startsWith('/uploads') ? `${baseUrl}${profilePic}` : profilePic || `https://avatar.iran.liara.run/public/boy?username=${sender.name || 'User'}`} 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex flex-col max-w-[75%] relative">
        {!fromMe && isGroup && (
          <span className="text-[10px] text-gray-400 ml-1 mb-0.5">{sender.name}</span>
        )}
        
        <div className="flex items-center gap-1 group/bubble">
          {fromMe && (
            <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 hover:bg-white/5 rounded-full text-gray-500 hover:text-gray-300 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          )}

          <div className={`${message.messageType === 'text' && !isEmojiOnly ? 'px-4 py-2' : 'p-1.5'} rounded-2xl text-sm ${bubbleBgColor} shadow-sm border border-white/5 break-words relative`}>
            {renderContent()}
            
            {showOptions && (
              <div className={`absolute z-20 top-0 ${fromMe ? 'right-full mr-2' : 'left-full ml-2'} bg-[#2a2a2a] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[150px] animate-in zoom-in-95 duration-100`}>
                <button 
                  onClick={() => setShowDeleteModal("me")}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 transition-colors"
                >
                  <UserX size={14} /> Delete for me
                </button>
                {fromMe && (
                  <button 
                    onClick={() => setShowDeleteModal("everyone")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={14} /> Delete for everyone
                  </button>
                )}
              </div>
            )}
          </div>

          {!fromMe && (
            <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity">
              <button 
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 hover:bg-white/5 rounded-full text-gray-500 hover:text-gray-300 transition-colors"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          )}
        </div>

        <div className={`text-[10px] text-gray-500 mt-1 flex items-center gap-1 ${fromMe ? "justify-end" : "justify-start"}`}>
          {formattedTime}
          {renderStatus()}
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showDeleteModal !== null}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={handleDelete}
        title={showDeleteModal === "everyone" ? "Delete for everyone?" : "Delete for me?"}
        message={showDeleteModal === "everyone" 
          ? "This message will be removed for everyone in this chat. They will see that you deleted a message." 
          : "This message will be removed from your chat history. This action cannot be undone."}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
export default Message;
