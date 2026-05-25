import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import { 
  setSelectedConversation as setSelectedConvAction, 
  setMessages as setMessagesAction,
  addMessage as addMessageAction
} from "@/store/chatSlice";

const useConversation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedConversation = useSelector((state: RootState) => state.chat.selectedConversation);
  const messages = useSelector((state: RootState) => state.chat.messages);

  const setSelectedConversation = useCallback((conversation: any) => {
    dispatch(setSelectedConvAction(conversation));
  }, [dispatch]);

  const setMessages = useCallback((newMessages: any) => {
    if (typeof newMessages === 'function') {
      // Note: This is a bit tricky with Redux as we don't have the current state here easily
      // but we can pass the messages we currently have from the selector
      dispatch(setMessagesAction(newMessages(messages)));
    } else {
      dispatch(setMessagesAction(newMessages));
    }
  }, [dispatch, messages]);

  const addMessage = useCallback((message: any) => {
    dispatch(addMessageAction(message));
  }, [dispatch]);

  return {
    selectedConversation,
    setSelectedConversation,
    messages,
    setMessages,
    addMessage,
  };
};

export default useConversation;
