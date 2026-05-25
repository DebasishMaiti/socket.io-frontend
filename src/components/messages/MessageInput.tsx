import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip, Smile, Mic, Square, X, Image as ImageIcon, Video, FileText } from "lucide-react";
import useSendMessage from "@/hooks/useSendMessage";
import useSendVoiceMessage from "@/hooks/useSendVoiceMessage";
import useSendFileMessage from "@/hooks/useSendFileMessage";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useSocketContext } from "@/context/SocketContext";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import useConversation from "@/hooks/useConversation";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { loading, sendMessage } = useSendMessage();
  const { sendVoiceMessage, voiceLoading } = useSendVoiceMessage();
  const { sendMediaMessage, loading: fileLoading } = useSendFileMessage();

  const { socket } = useSocketContext();
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { selectedConversation } = useConversation();
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Typing
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);

    if (!socket || !selectedConversation || !authUser) return;

    if (!isTyping) {
      setIsTyping(true);
      const participants = selectedConversation.participants?.map((p: any) => (typeof p === 'string' ? p : p._id)) || [selectedConversation._id];
      socket.emit("typing", {
        conversationId: selectedConversation._id,
        participants,
        senderName: authUser.name,
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        const participants = selectedConversation.participants?.map((p: any) => (typeof p === 'string' ? p : p._id)) || [selectedConversation._id];
        socket.emit("stopTyping", {
          conversationId: selectedConversation._id,
          participants,
        });
        setIsTyping(false);
      }
    }, 2000);
  };

  const stopTypingImmediate = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isTyping && socket && selectedConversation) {
      const participants = selectedConversation.participants?.map((p: any) => (typeof p === 'string' ? p : p._id)) || [selectedConversation._id];
      socket.emit("stopTyping", {
        conversationId: selectedConversation._id,
        participants,
      });
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    stopTypingImmediate();
    await sendMessage(message);
    setMessage("");
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: any) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await sendMediaMessage(file);
      setShowAttachmentMenu(false);
    }
  };

  const triggerFileInput = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        if (blob.size > 0) {
          await sendVoiceMessage(blob);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Emit Recording Event
      if (socket && selectedConversation && authUser) {
        const participants = selectedConversation.participants?.map((p: any) => (typeof p === 'string' ? p : p._id)) || [selectedConversation._id];
        socket.emit("recording", {
          conversationId: selectedConversation._id,
          participants,
          senderName: authUser.name,
        });
      }

      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      
      // Emit Stop Recording Event
      if (socket && selectedConversation) {
        const participants = selectedConversation.participants?.map((p: any) => (typeof p === 'string' ? p : p._id)) || [selectedConversation._id];
        socket.emit("stopRecording", {
          conversationId: selectedConversation._id,
          participants,
        });
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; 
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      // Emit Stop Recording Event
      if (socket && selectedConversation) {
        const participants = selectedConversation.participants?.map((p: any) => (typeof p === 'string' ? p : p._id)) || [selectedConversation._id];
        socket.emit("stopRecording", {
          conversationId: selectedConversation._id,
          participants,
        });
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='px-4 py-4 bg-white/5 border-t border-white/10 relative'>
      {/* Hidden File Input */}
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
      />

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-0 right-0 md:left-4 md:right-auto z-50 shadow-2xl flex justify-center md:block" ref={emojiPickerRef}>
          <div className="max-w-[90vw] md:max-w-none">
            <EmojiPicker 
              onEmojiClick={onEmojiClick} 
              theme={Theme.DARK}
              lazyLoadEmojis={true}
              width="100%"
            />
          </div>
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-20 left-4 z-50 bg-[#1e1e1e] border border-white/10 rounded-2xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200 min-w-[200px]" ref={attachmentMenuRef}>
          <div className="flex flex-col gap-1">
            <button 
              onClick={() => triggerFileInput("image/*")}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white"
            >
              <div className="p-2 bg-blue-500/20 text-blue-500 rounded-lg">
                <ImageIcon size={18} />
              </div>
              <span className="text-sm font-medium">Photos</span>
            </button>
            <button 
              onClick={() => triggerFileInput("video/*")}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white"
            >
              <div className="p-2 bg-purple-500/20 text-purple-500 rounded-lg">
                <Video size={18} />
              </div>
              <span className="text-sm font-medium">Videos</span>
            </button>
            <button 
              onClick={() => triggerFileInput(".pdf,.doc,.docx,.xls,.xlsx,.txt")}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 rounded-xl transition-colors text-white"
            >
              <div className="p-2 bg-orange-500/20 text-orange-500 rounded-lg">
                <FileText size={18} />
              </div>
              <span className="text-sm font-medium">Documents</span>
            </button>
          </div>
        </div>
      )}

      <form className='w-full relative flex items-center gap-2' onSubmit={handleSubmit}>
        {!isRecording && (
          <button 
            type="button" 
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className={`text-gray-400 hover:text-white transition-colors p-2 ${showAttachmentMenu ? 'text-white' : ''}`}
          >
            <Paperclip size={20} />
          </button>
        )}
        
        <div className="relative flex-1">
          {isRecording ? (
            <div className="w-full flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-500 text-sm font-medium">Recording {formatDuration(recordingDuration)}</span>
              </div>
              <button 
                type="button" 
                onClick={cancelRecording}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <input
                type='text'
                className='w-full pl-4 pr-12 py-3 bg-black/20 border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
                placeholder='Type a message...'
                value={message}
                onChange={handleTyping}
                disabled={voiceLoading || fileLoading}
              />
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors ${showEmojiPicker ? 'text-white' : ''}`}
              >
                <Smile size={20} />
              </button>
            </>
          )}
        </div>

        {message.trim() || isRecording ? (
          <button 
            type={isRecording ? 'button' : 'submit'}
            onClick={isRecording ? stopRecording : undefined}
            className={`p-3 ${isRecording ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center`}
            disabled={loading || voiceLoading || fileLoading}
          >
            {loading || voiceLoading || fileLoading ? (
              <Loader2 className='animate-spin' size={20} />
            ) : isRecording ? (
              <Square size={20} fill="currentColor" />
            ) : (
              <Send size={20} />
            )}
          </button>
        ) : (
          <button 
            type='button' 
            onClick={startRecording}
            className='p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center'
            disabled={voiceLoading || fileLoading}
          >
            <Mic size={20} />
          </button>
        )}
      </form>
    </div>
  );
};
export default MessageInput;
