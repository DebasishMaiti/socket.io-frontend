import React, { useEffect, useState } from "react";
import { ArrowLeft, User, Mail, Info, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { selectConversationDisplayInfo } from "@/store/chatSlice";
import { useSocketContext } from "@/context/SocketContext";
import { service, baseUrl } from "@/shared/_services/api_service";

interface UserInfoProps {
  onBack: () => void;
}

const UserInfo: React.FC<UserInfoProps> = ({ onBack }) => {
  const displayInfo = useSelector(selectConversationDisplayInfo);
  const { onlineUsers } = useSocketContext();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (displayInfo?.otherUser?._id || displayInfo?.otherUser) {
        try {
          const userId = displayInfo.otherUser._id || displayInfo.otherUser;
          const res = await service.getUserProfile(userId);
          setUserData(res.data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [displayInfo]);

  if (!displayInfo) return null;

  const { displayName, displayPic, otherUser } = displayInfo;
  const bio = userData?.bio || displayInfo.bio;
  const email = userData?.email || otherUser?.email;
  const isOnline = otherUser && onlineUsers.includes(String(otherUser._id || otherUser));

  return (
    <div className="flex flex-col w-full h-full bg-[#121212] animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4 bg-[#1e1e1e]/50">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">User Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {/* Profile Section */}
        <div className="p-8 flex flex-col items-center bg-gradient-to-b from-blue-600/5 to-transparent border-b border-white/5">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-3xl border-4 border-white/10 bg-blue-500/10 flex items-center justify-center text-blue-500 text-5xl font-bold overflow-hidden shadow-2xl">
              {displayPic ? (
                <img src={displayPic} className="w-full h-full object-cover" alt={displayName} />
              ) : (
                displayName?.charAt(0).toUpperCase()
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                   <Loader2 className="animate-spin text-white" size={24} />
                </div>
              )}
            </div>
            {isOnline && (
              <span className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-[#121212] rounded-full shadow-lg" />
            )}
          </div>
          <h3 className="text-2xl font-black text-white text-center">{displayName}</h3>
          <p className={`text-sm font-medium mt-1 ${isOnline ? "text-green-500" : "text-gray-500"}`}>
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>

        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Info Details */}
          <div className="bg-[#1e1e1e] rounded-3xl border border-white/10 overflow-hidden divide-y divide-white/5">
            <div className="p-4 flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Name</p>
                <p className="text-white font-medium">{displayName}</p>
              </div>
            </div>

            <div className="p-4 flex items-start gap-4">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email</p>
                <p className="text-white font-medium">{email || "N/A"}</p>
              </div>
            </div>

            <div className="p-4 flex items-start gap-4">
              <div className="p-2 bg-green-500/10 rounded-xl text-green-500">
                <Info size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Bio</p>
                <p className="text-white font-medium leading-relaxed">
                  {loading ? "Loading bio..." : (bio || "No bio set yet.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
