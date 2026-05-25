import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { sendFileMessage } from "@/store/chatSlice";
import { toast } from "sonner";

const useSendFileMessage = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { selectedConversation } = useSelector((state: RootState) => state.chat);

  const sendMediaMessage = async (file: File) => {
    if (!selectedConversation) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      await dispatch(sendFileMessage(selectedConversation._id, formData));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { sendMediaMessage, loading };
};

export default useSendFileMessage;
