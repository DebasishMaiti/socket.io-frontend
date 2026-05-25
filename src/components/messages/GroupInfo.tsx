import React, { useState } from "react";
import { X, Shield, ShieldAlert, UserMinus, LogOut, Loader2, Camera, UserPlus, Check, ArrowLeft } from "lucide-react";
import useGetUsers from "@/hooks/useGetUsers";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { groupAction } from "@/store/chatSlice";
import { toast } from "sonner";
import ConfirmationModal from "../shared/ConfirmationModal";
import { baseUrl } from "@/shared/_services/api_service";

interface GroupInfoProps {
  onBack: () => void;
}

const GroupInfo: React.FC<GroupInfoProps> = ({ onBack }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { selectedConversation } = useSelector((state: RootState) => state.chat);
  const { loading: loadingUsers, users } = useGetUsers();

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedToGroup, setSelectedToGroup] = useState<string[]>([]);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    variant: "danger" | "warning" | "info";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    variant: "info",
    title: "",
    message: "",
    onConfirm: () => { },
  });

  if (!selectedConversation || !selectedConversation.isGroup) return null;

  const admins = selectedConversation.admins || [];
  const participants = selectedConversation.participants || [];
  const isAdmin = admins.some((a: any) => (typeof a === 'string' ? a : a._id) === authUser?._id);

  const openConfirmation = (variant: "danger" | "warning" | "info", title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, variant, title, message, onConfirm });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");

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
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    if (action === "leave") onBack();
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
    <div className="flex flex-col w-full h-full bg-[#121212] animate-in slide-in-from-right duration-300 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4 bg-[#1e1e1e]/50">
        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-white">Group Info</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {/* Profile Section */}
        <div className="p-8 flex flex-col items-center bg-gradient-to-b from-blue-600/5 to-transparent border-b border-white/5">
          <div className="relative group/avatar mb-4">
            <div className="w-32 h-32 rounded-3xl border-4 border-white/10 bg-blue-500/10 flex items-center justify-center text-blue-500 text-5xl font-bold overflow-hidden shadow-2xl">
              {selectedConversation.groupImage ? (
                <img src={selectedConversation.groupImage?.startsWith('data:') ? selectedConversation.groupImage : `${baseUrl}${selectedConversation.groupImage}`} className="w-full h-full object-cover" alt="Group" />
              ) : (
                selectedConversation.groupName?.charAt(0).toUpperCase()
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
            </div>
            {isAdmin && (
              <label className="absolute -bottom-2 -right-2 p-3 bg-blue-600 rounded-2xl border-4 border-[#121212] cursor-pointer hover:bg-blue-500 transition-all shadow-xl hover:scale-110 active:scale-95">
                <Camera size={18} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
              </label>
            )}
          </div>
          <h3 className="text-2xl font-black text-white text-center">{selectedConversation.groupName}</h3>
          <p className="text-gray-400 font-medium mt-1">{participants.length} Members</p>
        </div>

        <div className="max-w-2xl mx-auto p-6 space-y-8">
          {/* Members List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Participants</h4>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMembers(true)}
                  className="flex items-center gap-2 text-sm font-bold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20"
                >
                  <UserPlus size={16} />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            <div className="bg-[#1e1e1e] rounded-3xl border border-white/10 overflow-hidden divide-y divide-white/5">
              {isAddingMembers ? (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-white">Add New Members</span>
                    <button onClick={() => setIsAddingMembers(false)} className="text-sm text-blue-500 font-bold">Cancel</button>
                  </div>
                  <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {potentialMembers.map((user: any) => (
                      <div key={user._id} onClick={() => toggleUserSelection(user._id)} className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group">
                        <img src={user.profilePic 
                          ? (user.profilePic.startsWith('data:') ? user.profilePic : `${baseUrl}${user.profilePic}`)
                          : `https://avatar.iran.liara.run/public/boy?username=${user.name}`} 
                          className="w-10 h-10 rounded-full border border-white/10" alt={user.name} />
                        <span className="flex-1 text-sm font-medium text-white">{user.name}</span>
                        <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${selectedToGroup.includes(user._id) ? 'bg-blue-600 border-blue-600' : 'border-white/20'}`}>
                          {selectedToGroup.includes(user._id) && <Check size={14} className="text-white" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleAddMembers} disabled={selectedToGroup.length === 0 || loadingAction === "adding"} className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-bold shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2">
                    {loadingAction === "adding" ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                    <span>Add {selectedToGroup.length > 0 ? `(${selectedToGroup.length})` : ''} Selected</span>
                  </button>
                </div>
              ) : (
                participants.map((member: any) => {
                  const memberId = typeof member === 'string' ? member : member._id;
                  const isMemberAdmin = admins.some((a: any) => (typeof a === 'string' ? a : a._id) === memberId);
                  const isMe = memberId === authUser?._id;

                  return (
                    <div key={memberId} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-all group">
                      <div className="relative">
                        <img src={member.profilePic?.startsWith('/uploads') ? `${baseUrl}${member.profilePic}` : member.profilePic || `https://avatar.iran.liara.run/public/boy?username=${member.name}`} className="w-12 h-12 rounded-full border-2 border-white/10 object-cover" alt={member.name} />
                        {isMemberAdmin && <div className="absolute -top-1 -right-1 bg-blue-600 rounded-full p-1 border-2 border-[#1e1e1e]"><Shield size={10} className="text-white" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{member.name} {isMe && <span className="text-gray-500 font-normal ml-1">(You)</span>}</p>
                        <p className="text-xs text-gray-500 font-medium">{isMemberAdmin ? "Group Admin" : "Member"}</p>
                      </div>

                      {isAdmin && !isMe && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          {isMemberAdmin ? (
                            <button onClick={() => openConfirmation("warning", "Demote Admin", `Are you sure you want to demote ${member.name} to member?`, () => handleAction("demote", memberId))} className="p-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 rounded-xl" title="Demote">
                              <ShieldAlert size={18} />
                            </button>
                          ) : (
                            <button onClick={() => openConfirmation("info", "Promote to Admin", `Are you sure you want to make ${member.name} a group admin?`, () => handleAction("promote", memberId))} className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl" title="Promote">
                              <Shield size={18} />
                            </button>
                          )}
                          {!isMemberAdmin && (
                            <button onClick={() => openConfirmation("danger", "Remove Member", `Are you sure you want to remove ${member.name} from this group?`, () => handleAction("kick", memberId))} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl" title="Kick">
                              <UserMinus size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-8">
            <button
              onClick={() => openConfirmation("danger", "Leave Group", "Are you sure you want to leave this group? You will no longer be able to send or receive messages.", () => handleAction("leave"))}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-3xl border-2 border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all font-black uppercase tracking-widest text-sm active:scale-95 shadow-xl hover:shadow-red-500/20"
            >
              <LogOut size={20} />
              <span>Leave Group</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        isLoading={!!loadingAction}
      />
    </div>
  );
};

export default GroupInfo;
