import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchConversationsAndUsers } from "@/store/chatSlice";
import { RootState, AppDispatch } from "@/store/store";

const useGetConversations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { conversations, status } = useSelector((state: RootState) => state.chat);
  const loading = status === "loading";

  useEffect(() => {
    dispatch(fetchConversationsAndUsers());
  }, [dispatch]);

  return { loading, conversations };
};

export default useGetConversations;
