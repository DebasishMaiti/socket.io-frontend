import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendTextMessage, sendAudioMessage } from "@/store/chatSlice";
import { RootState, AppDispatch } from "@/store/store";

const useSendMessage = () => {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const selectedConversation = useSelector((state: RootState) => state.chat.selectedConversation);

  const sendMessage = async (content: string) => {
    if (!selectedConversation?._id) return;
    setLoading(true);
    await dispatch(sendTextMessage(selectedConversation._id, content));
    setLoading(false);
  };

  const sendVoiceMessage = async (formData: FormData) => {
    if (!selectedConversation?._id) return;
    setLoading(true);
    await dispatch(sendAudioMessage(selectedConversation._id, formData));
    setLoading(false);
  };

  return { sendMessage, sendVoiceMessage, loading };
};

export default useSendMessage;
