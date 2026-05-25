import MessageContainer from "@/components/messages/MessageContainer";
import Sidebar from "@/components/sidebar/Sidebar";
import useConversation from "@/hooks/useConversation";

const Home = () => {
  const { selectedConversation } = useConversation();

  return (
    <div className='flex h-full w-full md:rounded-2xl overflow-hidden bg-black/40 backdrop-blur-2xl md:border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]'>
      <div className={`${selectedConversation ? "hidden md:flex" : "flex"} w-full md:w-80 h-full border-r border-white/10`}>
        <Sidebar />
      </div>
      <div className={`${!selectedConversation ? "hidden md:flex" : "flex"} flex-1 h-full`}>
        <MessageContainer />
      </div>
    </div>
  );
};
export default Home;

