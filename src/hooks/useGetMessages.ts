import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMessages } from "@/store/chatSlice";
import { RootState, AppDispatch } from "@/store/store";

const useGetMessages = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { messages, selectedConversation, status } = useSelector((state: RootState) => state.chat);
  const loading = status === "loading";

  useEffect(() => {
    if (selectedConversation?._id) {
      dispatch(fetchMessages(selectedConversation._id));
    }
  }, [selectedConversation?._id, dispatch]);

  return { messages, loading };
};

export default useGetMessages;
