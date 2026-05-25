import { X, Shield, ShieldAlert, UserMinus, LogOut, Loader2, Camera, UserPlus, Check } from "lucide-react";
import useGetUsers from "@/hooks/useGetUsers";
import { baseUrl } from "@/shared/_services/api_service";
import { toast } from "sonner";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { groupAction } from "@/store/chatSlice";

interface GroupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GroupSettingsModal: React.FC<GroupSettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { selectedConversation } = useSelector((state: RootState) => state.chat);
  const { loading: loadingUsers, users } = useGetUsers();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedToGroup, setSelectedToGroup] = useState<string[]>([]);

  if (!isOpen || !selectedConversation || !selectedConversation.isGroup) return null;

  const admins = selectedConversation.admins || [];
  const participants = selectedConversation.participants || [];
  const isAdmin = admins.some((a: any) => (typeof a === 'string' ? a : a._id) === authUser?._id);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }

    const formData = new FormData();
    formData.append("image", file);

    setIsUploading(true);
    await dispatch(groupAction("updateProfile", selectedConversation._id, { formData }));
    setIsUploading(false);
  };

  const handleAction = async (action: string, targetUserId?: string) => {
    setLoadingAction(targetUserId || action);
    await dispatch(groupAction(action, selectedConversation._id, { userId: targetUserId }));
    setLoadingAction(null);
    if (action === "leave") onClose();
  };

  const handleAddMembers = async () => {
    if (selectedToGroup.length === 0) return;
    setLoadingAction("adding");
    await dispatch(groupAction("addMembers", selectedConversation._id, { participants: selectedToGroup }));
    setLoadingAction(null);
    setIsAddingMembers(false);
    setSelectedToGroup([]);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedToGroup(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const potentialMembers = users.filter((u: any) => 
    !participants.some((p: any) => (typeof p === 'string' ? p : p._id) === u._id)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-white">Group Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-4 flex flex-col items-center border-b border-white/10 bg-white/5">
          <div className="relative group/avatar">
            <div className="w-24 h-24 rounded-full border-2 border-blue-500/30 bg-blue-500/10 flex items-center justify-center text-blue-500 text-4xl font-bold overflow-hidden">
              {selectedConversation.groupImage ? (
                <img 
                  src={selectedConversation.groupImage?.startsWith('data:') ? selectedConversation.groupImage : `${baseUrl}${selectedConversation.groupImage}`} 
                  className="w-full h-full object-cover" 
                  alt="Group" 
                />
              ) : (
                selectedConversation.groupName?.charAt(0).toUpperCase()
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={24} />
                </div>
              )}
            </div>
            
            {isAdmin && (
              <label className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full border-2 border-[#1e1e1e] cursor-pointer hover:bg-blue-500 transition-all shadow-lg">
                <Camera size={14} className="text-white" />
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
          <h3 className="text-xl font-bold text-white mt-3">{selectedConversation.groupName}</h3>
          <p className="text-sm text-gray-400">{participants.length} members</p>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar p-2">
          {isAddingMembers ? (
            <div className="space-y-4 p-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-semibold text-white">Select Users</span>
                <button 
                  onClick={() => setIsAddingMembers(false)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Back to members
                </button>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {potentialMembers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">No new users available</div>
                ) : (
                  potentialMembers.map((user: any) => (
                    <div 
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors"
                    >
                      <img 
                        src={user.profilePic 
                          ? (user.profilePic.startsWith('data:') ? user.profilePic : `${baseUrl}${user.profilePic}`)
                          : `https://avatar.iran.liara.run/public/boy?username=${user.name}`} 
                        className="w-10 h-10 rounded-full border border-white/10"
                        alt={user.name}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedToGroup.includes(user._id) ? 'bg-blue-500 border-blue-500' : 'border-white/20'}`}>
                        {selectedToGroup.includes(user._id) && <Check size={12} className="text-white" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={handleAddMembers}
                disabled={selectedToGroup.length === 0 || loadingAction === "adding"}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                {loadingAction === "adding" ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                <span>Add {selectedToGroup.length > 0 ? `(${selectedToGroup.length})` : ''} Members</span>
              </button>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Members</span>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAddingMembers(true)}
                    className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full hover:bg-blue-500/20 transition-all"
                  >
                    <UserPlus size={12} />
                    <span>Add New</span>
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {participants.map((member: any) => {
                  const memberId = typeof member === 'string' ? member : member._id;
                  const isMemberAdmin = admins.some((a: any) => (typeof a === 'string' ? a : a._id) === memberId);
                  const isMe = memberId === authUser?._id;

                  return (
                    <div key={memberId} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-colors group">
                      <div className="relative">
                        <img
                          src={member.profilePic?.startsWith('/uploads') ? `${baseUrl}${member.profilePic}` : member.profilePic || `https://avatar.iran.liara.run/public/boy?username=${member.name}`}
                          alt={member.name}
                          className="w-10 h-10 rounded-full border border-white/10 object-cover"
                        />
                        {isMemberAdmin && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-[#1e1e1e]" title="Admin">
                            <Shield size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {member.name} {isMe && <span className="text-gray-500 text-xs font-normal">(You)</span>}
                        </p>
                        <p className="text-[10px] text-gray-500">{isMemberAdmin ? "Admin" : "Member"}</p>
                      </div>
                      
                      {isAdmin && !isMe && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isMemberAdmin ? (
                            <button
                              onClick={() => handleAction("demote", memberId)}
                              disabled={!!loadingAction}
                              className="p-2 hover:bg-yellow-500/20 text-yellow-500 rounded-lg transition-colors"
                              title="Demote to Member"
                            >
                              <ShieldAlert size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction("promote", memberId)}
                              disabled={!!loadingAction}
                              className="p-2 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                              title="Promote to Admin"
                            >
                              <Shield size={16} />
                            </button>
                          )}
                          {!isMemberAdmin && (
                            <button
                              onClick={() => handleAction("kick", memberId)}
                              disabled={!!loadingAction}
                              className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                              title="Kick from Group"
                            >
                              <UserMinus size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
          <button
            onClick={() => handleAction("leave")}
            disabled={!!loadingAction}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all font-medium"
          >
            {loadingAction === "leave" ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <LogOut size={18} />
                <span>Leave Group</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
