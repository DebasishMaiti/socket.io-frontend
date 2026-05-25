import useGetConversations from "@/hooks/useGetConversations";
import Conversation from "@/components/sidebar/Conversation";
import { Loader2 } from "lucide-react";

const Conversations = () => {
  const { loading, conversations } = useGetConversations();

  return (
    <div className='flex-1 overflow-auto custom-scrollbar'>
      {conversations.map((conversation, idx) => (
        <Conversation
          key={conversation._id}
          conversation={conversation}
          lastIdx={idx === conversations.length - 1}
        />
      ))}

      {loading ? <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-500" /></div> : null}
    </div>
  );
};
export default Conversations;
