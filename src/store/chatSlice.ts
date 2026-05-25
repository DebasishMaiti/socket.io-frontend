import { createSlice } from "@reduxjs/toolkit";
import { setLoading } from "./loader";
import { errorHandler, successHandler } from "@/shared/_helper/responseHelper";
import { service, baseUrl } from "@/shared/_services/api_service";

const STATUS = Object.freeze({
  IDLE: "idle",
  ERROR: "error",
  LOADING: "loading",
});

const initialState = {
  conversations: [],
  selectedConversation: null,
  messages: [],
  users: [],
  status: STATUS.IDLE,
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConversations(state, { payload }) {
      state.conversations = payload;
    },
    setSelectedConversation(state, { payload }) {
      state.selectedConversation = payload;
      if (payload) {
        // Clear unread count for this conversation
        const index = state.conversations.findIndex((c) => c._id === payload._id);
        if (index !== -1) {
          state.conversations[index].unreadCount = 0;
        }
      }
    },
    setMessages(state, { payload }) {
      state.messages = payload;
    },
    addMessage(state, { payload }) {
      state.messages.push(payload);
    },
    setUsers(state, { payload }) {
      state.users = payload;
    },
    updateConversationInList(state, { payload }) {
      // Find index by conversation ID or by participant ID (for 1-to-1)
      let index = state.conversations.findIndex((c) => c._id === payload._id);
      
      if (index === -1 && !payload.isGroup) {
        // Try to find if this person is in the list as a User object
        const otherParticipant = payload.participants.find((p: any) => 
          (p._id || p) !== (state as any).authUser?._id // We need authUser here, but it's in authSlice
        );
        // Let's just use the participants check generically
        index = state.conversations.findIndex((c) => 
          !c.isGroup && payload.participants.some((p: any) => (p._id || p) === c._id)
        );
      }

      if (index !== -1) {
        const currentUnread = state.conversations[index].unreadCount || 0;
        state.conversations[index] = { ...payload, unreadCount: payload.unreadCount ?? currentUnread };
      } else {
        state.conversations.unshift({ ...payload, unreadCount: payload.unreadCount || 0 });
      }
      
      if (state.selectedConversation?._id === payload._id || 
         (!payload.isGroup && payload.participants.some((p: any) => (p._id || p) === state.selectedConversation?._id))) {
        state.selectedConversation = payload;
      }
    },
    removeConversationFromList(state, { payload }) {
      state.conversations = state.conversations.filter((c) => c._id !== payload);
      if (state.selectedConversation?._id === payload) {
        state.selectedConversation = null;
      }
    },
    updateMessageStatus(state, { payload }) {
      const { conversationId, userId } = payload;
      const selectedId = String(state.selectedConversation?._id);
      const seenId = String(userId);
      const convId = String(conversationId);

      // Check if this seen event belongs to the currently active chat
      const isCurrent = selectedId === convId || 
        (!state.selectedConversation?.isGroup && (
          selectedId === seenId ||
          state.selectedConversation?.participants?.some((p: any) => String(p._id || p) === seenId)
        ));

      if (isCurrent) {
        state.messages = state.messages.map((msg) => {
          const msgSenderId = String(msg.senderId?._id || msg.senderId);
          // If the message was NOT sent by the person who just saw it (seenId), 
          // it means someone else saw it, so mark as seen.
          if (msg.status !== 'seen' && msgSenderId !== seenId) {
            return { ...msg, status: 'seen' };
          }
          return msg;
        });
      }
    },


    incrementUnread(state, { payload: conversationId }) {
      let index = state.conversations.findIndex((c) => c._id === conversationId);
      
      // If not found by ID, it might be a new message from a user we haven't talked to yet 
      // or we have them in the list as a User object (their _id is their userId)
      if (index === -1) {
        index = state.conversations.findIndex((c) => 
          !c.isGroup && c.participants?.some((p: any) => (p._id || p) === conversationId)
        );
      }

      if (index !== -1) {
        state.conversations[index].unreadCount = (state.conversations[index].unreadCount || 0) + 1;
      }
    },
    clearUnread(state, { payload: id }) {
      let index = state.conversations.findIndex((c) => c._id === id);
      
      if (index === -1) {
        index = state.conversations.findIndex((c) => 
          !c.isGroup && c.participants?.some((p: any) => (p._id || p) === id)
        );
      }

      if (index !== -1) {
        state.conversations[index].unreadCount = 0;
      }
    },
    removeMessageFromState(state, { payload: messageId }) {
      state.messages = state.messages.filter((m) => m._id !== messageId);
    },
    updateConversationLastMessage(state, { payload }) {
      const { conversationId, lastMessage, incrementUnread } = payload;
      let index = state.conversations.findIndex(c => c._id === conversationId);
      
      if (index === -1 && lastMessage.senderId) {
        const otherId = (lastMessage.senderId._id || lastMessage.senderId);
        index = state.conversations.findIndex(c => 
          !c.isGroup && c.participants?.some((p: any) => (p._id || p) === otherId)
        );
      }

      if (index !== -1) {
        const conv = { ...state.conversations[index] };
        conv.lastMessage = lastMessage;
        if (incrementUnread && state.selectedConversation?._id !== conversationId) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
        state.conversations.splice(index, 1);
        state.conversations.unshift(conv);
      }
    },
    setStatus(state, { payload }) {
      state.status = payload;
    },
  },
});

// Selectors
export const selectConversationDisplayInfo = (state) => {
  const { selectedConversation } = state.chat;
  const { chatUser: authUser } = state.auth;
  
  if (!selectedConversation) return null;

  const isGroup = selectedConversation.isGroup;
  const otherUser = !isGroup && selectedConversation.participants
    ? selectedConversation.participants.find((p: any) => (p._id || p) !== authUser?._id)
    : null;

  const displayName = isGroup
    ? selectedConversation.groupName
    : (otherUser?.name || selectedConversation.name);

  let displayPic = isGroup
    ? selectedConversation.groupImage
    : (otherUser?.profilePic || selectedConversation.profilePic);

  // Use the same URL construction logic as elsewhere
  if (displayPic?.startsWith('/uploads')) {
    displayPic = `${baseUrl}${displayPic}`;
  }

  const bio = isGroup ? "" : (otherUser?.bio || selectedConversation.bio || "");

  return { displayName, displayPic, otherUser, isGroup, bio };
};

// Helper to find conversation index by either its own ID or a participant's ID
const findConvIndex = (conversations: any[], id: string) => {
  let index = conversations.findIndex((c) => c._id === id);
  if (index === -1) {
    index = conversations.findIndex((c) => 
      !c.isGroup && c.participants?.some((p: any) => (p._id || p) === id)
    );
  }
  return index;
};

export const { 
  setConversations, 
  setSelectedConversation, 
  setMessages, 
  addMessage, 
  setUsers, 
  updateConversationInList, 
  removeConversationFromList,
  updateMessageStatus,
  incrementUnread,
  clearUnread,
  removeMessageFromState,
  updateConversationLastMessage,
  setStatus 
} = chatSlice.actions;

export default chatSlice.reducer;

// Thunks

export function deleteMessage(messageId: string, type: 'me' | 'everyone') {
  return async function deleteMessageThunk(dispatch) {
    try {
      if (type === 'me') {
        await service.deleteMessageForMe(messageId);
      } else {
        await service.deleteMessageForEveryone(messageId);
      }
      dispatch(removeMessageFromState(messageId));
      successHandler(`Message deleted for ${type === 'me' ? 'you' : 'everyone'}`);
    } catch (error: any) {
      errorHandler(error.response);
    }
  };
}

export function fetchConversationsAndUsers() {
  return async function fetchConversationsAndUsersThunk(dispatch) {
    dispatch(setStatus(STATUS.LOADING));
    dispatch(setLoading(true));
    try {
      const [convRes, userRes] = await Promise.all([
        service.getConversations(),
        service.getUsers()
      ]);
      
      const conversationsData = convRes.data;
      const usersData = userRes.data;

      // Merge logic as before
      const merged = [...conversationsData];
      usersData.forEach((user: any) => {
        const hasConversation = conversationsData.some((conv: any) => 
          !conv.isGroup && conv.participants.some((p: any) => p._id === user._id)
        );
        if (!hasConversation) {
          merged.push(user);
        }
      });

      dispatch(setConversations(merged));
      dispatch(setUsers(usersData));
      dispatch(setStatus(STATUS.IDLE));
    } catch (error: any) {
      dispatch(setStatus(STATUS.ERROR));
      errorHandler(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function fetchMessages(conversationId: string) {
  return async function fetchMessagesThunk(dispatch) {
    dispatch(setStatus(STATUS.LOADING));
    // Not using global loader here to allow background fetching
    try {
      const res = await service.getMessages(conversationId);
      dispatch(setMessages(res.data));
      dispatch(setStatus(STATUS.IDLE));
    } catch (error: any) {
      dispatch(setStatus(STATUS.ERROR));
      errorHandler(error.response);
    }
  };
}

export function sendTextMessage(id: string, content: string) {
  return async function sendTextMessageThunk(dispatch) {
    try {
      const res = await service.sendMessage(id, content);
      dispatch(addMessage(res.data));
      dispatch(updateConversationLastMessage({ 
        conversationId: res.data.conversationId, 
        lastMessage: res.data, 
        incrementUnread: false 
      }));
    } catch (error: any) {
      errorHandler(error.response);
    }
  };
}

export function sendAudioMessage(id: string, formData: FormData) {
  return async function sendAudioMessageThunk(dispatch) {
    try {
      const res = await service.sendVoiceMessage(id, formData);
      dispatch(addMessage(res.data));
      dispatch(updateConversationLastMessage({ 
        conversationId: res.data.conversationId, 
        lastMessage: res.data, 
        incrementUnread: false 
      }));
    } catch (error: any) {
      errorHandler(error.response);
    }
  };
}

export function sendFileMessage(id: string, formData: FormData) {
  return async function sendFileMessageThunk(dispatch) {
    try {
      const res = await service.sendMediaMessage(id, formData);
      dispatch(addMessage(res.data));
      dispatch(updateConversationLastMessage({ 
        conversationId: res.data.conversationId, 
        lastMessage: res.data, 
        incrementUnread: false 
      }));
    } catch (error: any) {
      errorHandler(error.response);
    }
  };
}

export function groupAction(action: string, conversationId: string, data?: any) {
  return async function groupActionThunk(dispatch) {
    dispatch(setLoading(true));
    try {
      let res;
      switch (action) {
        case 'leave': res = await service.leaveGroup(conversationId); break;
        case 'kick': res = await service.kickMember(conversationId, data.userId); break;
        case 'promote': res = await service.promoteAdmin(conversationId, data.userId); break;
        case 'demote': res = await service.demoteAdmin(conversationId, data.userId); break;
        case 'addMembers': res = await service.addMembers(conversationId, data.participants); break;
        case 'updateProfile': res = await service.updateGroupProfile(conversationId, data.formData); break;
      }
      
      if (action === 'leave') {
        dispatch(setSelectedConversation(null));
        dispatch(removeConversationFromList(conversationId));
      } else if (res?.data) {
        dispatch(updateConversationInList(res.data));
      }
      
      if (res?.data?.message) successHandler(res.data.message);
      else successHandler(`${action.charAt(0).toUpperCase() + action.slice(1)} successful`);
      
      return res?.data;
    } catch (error: any) {
      errorHandler(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function createNewGroup(data: any, onClose: () => void) {
  return async function createNewGroupThunk(dispatch) {
    dispatch(setLoading(true));
    try {
      const res = await service.createGroup(data);
      dispatch(updateConversationInList(res.data));
      dispatch(setSelectedConversation(res.data));
      successHandler("Group created successfully");
      onClose();
    } catch (error: any) {
      errorHandler(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };
}
