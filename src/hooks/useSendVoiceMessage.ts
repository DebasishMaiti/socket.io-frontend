import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { sendAudioMessage } from "@/store/chatSlice";
import { AppDispatch, RootState } from "@/store/store";

const useSendVoiceMessage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedConversation } = useSelector((state: RootState) => state.chat);
  const [voiceLoading, setVoiceLoading] = useState(false);

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedConversation?._id) return;
    setVoiceLoading(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");
      await dispatch(sendAudioMessage(selectedConversation._id, formData));
    } finally {
      setVoiceLoading(false);
    }
  };

  return { sendVoiceMessage, voiceLoading };
};
export default useSendVoiceMessage;
