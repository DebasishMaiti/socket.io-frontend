import Conversations from "@/components/sidebar/Conversations";
//import LogoutButton from "@/components/sidebar/LogoutButton";
import SearchInput from "@/components/sidebar/SearchInput";
import { Settings, User, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import CreateGroupModal from "./CreateGroupModal";
import useGetConversations from "@/hooks/useGetConversations";
import { baseUrl } from "@/shared/_services/api_service";
import AppLogo from "@/components/shared/AppLogo";

const Sidebar = () => {
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { refreshConversations }:any = useGetConversations();

  const profilePic = authUser?.profilePic && typeof authUser.profilePic === 'string'
    ? (authUser.profilePic.startsWith('http') || authUser.profilePic.startsWith('data:') 
        ? authUser.profilePic 
        : `${baseUrl}${authUser.profilePic}`)
    : null;

  return (
    <div className='border-r border-white/10 p-4 flex flex-col w-full md:w-80 h-full'>
      <AppLogo href="/" size="md" className="mb-4 px-1" />
      <SearchInput />

      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-4 mb-2 flex items-center justify-center gap-2 p-3 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all font-semibold text-sm"
      >
        <Users size={18} />
        Create New Group
      </button>

      <div className='my-2 border-t border-white/10' />
      <Conversations />

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={refreshConversations}
      />

      <div className="mt-auto pt-4 border-t border-white/10 space-y-4">
        <Link
          to="/profile"
          className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl transition-all group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-black/20">
            {profilePic ? (
              <img src={profilePic} alt="Me" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <User size={20} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{authUser?.name}</p>
            <p className="text-[10px] text-gray-500">My Profile</p>
          </div>
          <Settings size={18} className="text-gray-500 group-hover:text-white transition-colors" />
        </Link>
        {/* <LogoutButton /> */}
      </div>
    </div>
  );
};
export default Sidebar;
