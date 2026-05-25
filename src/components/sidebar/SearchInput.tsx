import { useState } from "react";
import { Search } from "lucide-react";
import useConversation from "@/hooks/useConversation";
import useGetConversations from "@/hooks/useGetConversations";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const SearchInput = () => {
  const [search, setSearch] = useState("");
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const { setSelectedConversation } = useConversation();
  const { conversations } = useGetConversations();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    if (search.length < 3) {
      return toast.error("Search term must be at least 3 characters long");
    }

    const conversation = conversations.find((c: any) => {
      if (c.isGroup) return c.groupName?.toLowerCase().includes(search.toLowerCase());
      
      const otherUser = c.participants?.find((p: any) => p._id !== authUser?._id);
      return otherUser?.name?.toLowerCase().includes(search.toLowerCase()) || c.name?.toLowerCase().includes(search.toLowerCase());
    });

    if (conversation) {
      setSelectedConversation(conversation);
      setSearch("");
    } else toast.error("No such conversation or user found!");
  };

  return (
    <form onSubmit={handleSubmit} className='flex items-center gap-2'>
      <div className="relative flex-1">
        <input
          type='text'
          placeholder='Search users...'
          className='w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-full text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-500'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
      </div>
      <button type='submit' className='p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all'>
        <Search size={18} />
      </button>
    </form>
  );
};
export default SearchInput;
