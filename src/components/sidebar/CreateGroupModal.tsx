import React, { useState } from "react";
import { X, Users, Check, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { createNewGroup } from "@/store/chatSlice";
import useGetUsers from "@/hooks/useGetUsers";
import { toast } from "sonner";
import { baseUrl } from "@/shared/_services/api_service";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading: loadingUsers, users } = useGetUsers();
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error("Group name is required");
    if (selectedUsers.length < 1) return toast.error("Select at least one member");

    setIsCreating(true);
    await dispatch(createNewGroup(
      { groupName, participants: selectedUsers },
      () => {
        onGroupCreated();
        onClose();
        setGroupName("");
        setSelectedUsers([]);
      }
    ));
    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-500" />
            <h2 className="text-lg font-bold text-white">Create New Group</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Group Name</label>
            <input
              type="text"
              placeholder="Enter group name..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Members</label>
              <span className="text-xs text-gray-500">{selectedUsers.length} selected</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl max-h-60 overflow-y-auto custom-scrollbar">
              {loadingUsers ? (
                <div className="p-8 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-blue-500" />
                  <p className="text-sm text-gray-400">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users found</div>
              ) : (
                <div className="divide-y divide-white/5">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      onClick={() => toggleUser(user._id)}
                      className="flex items-center gap-3 p-3 hover:bg-white/5 cursor-pointer transition-colors group"
                    >
                      <div className="relative">
                        <img
                          src={user.profilePic?.startsWith('/uploads') ? `${baseUrl}${user.profilePic}` : user.profilePic || `https://avatar.iran.liara.run/public/boy?username=${user.name}`}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border border-white/10 object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        selectedUsers.includes(user._id) 
                          ? "bg-blue-500 border-blue-500" 
                          : "border-white/20 group-hover:border-white/40"
                      }`}>
                        {selectedUsers.includes(user._id) && <Check size={14} className="text-white" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || selectedUsers.length < 1}
            className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-medium transition-all flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Group</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
