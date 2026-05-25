import { createSlice } from "@reduxjs/toolkit";
import { setLoading } from "./loader";
import { errorHandler, successHandler } from "@/shared/_helper/responseHelper";
import { service } from "@/shared/_services/api_service";
import { localService } from "@/shared/_session/local";

const STATUS = Object.freeze({
  IDLE: "idle",
  ERROR: "error",
  LOADING: "loading",
});

const initialState = {
  user: null,
  chatUser: JSON.parse(localService.get('chat-user') || "null"),
  status: STATUS.IDLE,
  isAuthenticated: !!localService.get('token'),
  isLoginModalOpen: false
};

export const authSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setChatUserData(state, { payload }) {
      state.chatUser = payload;
      localService.set("chat-user", JSON.stringify(payload));
      if (payload.token) {
        localService.set("token", payload.token);
      }
      state.isAuthenticated = true;
    },
    setStatus(state, { payload }) {
      state.status = payload;
    },
    setLogout(state) {
      localService.clearAll();
      state.chatUser = null;
      state.isAuthenticated = false;
      state.status = STATUS.IDLE;
    },
    setLoginModalOpen(state, { payload }) {
      state.isLoginModalOpen = payload
    }
  },
});

export const { setChatUserData, setStatus, setLogout, setLoginModalOpen } = authSlice.actions;
export default authSlice.reducer;

// thunks

export function loginChatUser(data, navigate) {
  return async function loginChatUserThunk(dispatch) {
    dispatch(setStatus(STATUS.LOADING));
    dispatch(setLoading(true));
    try {
      const res = await service.login(data);
      dispatch(setChatUserData(res.data));
      successHandler("Welcome back!");
      navigate("/");
      dispatch(setStatus(STATUS.IDLE));
    } catch (error: any) {
      dispatch(setStatus(STATUS.ERROR));
      errorHandler(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function signupChatUser(data, navigate) {
  return async function signupChatUserThunk(dispatch) {
    dispatch(setStatus(STATUS.LOADING));
    dispatch(setLoading(true));
    try {
      const res = await service.signup(data);
      dispatch(setChatUserData(res.data));
      successHandler("Account created successfully!");
      navigate("/");
      dispatch(setStatus(STATUS.IDLE));
    } catch (error: any) {
      dispatch(setStatus(STATUS.ERROR));
      errorHandler(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function logoutUser(navigate) {
  return async function logoutUserThunk(dispatch) {
    dispatch(setStatus(STATUS.LOADING));
    dispatch(setLoading(true));
    try {
      await service.logout();
      dispatch(setLogout());
      successHandler("Logged out successfully.");
      if (navigate) navigate("/login");
      dispatch(setStatus(STATUS.IDLE));
    } catch (error: any) {
      dispatch(setStatus(STATUS.ERROR));
      // Even if API fails, we usually want to clear local state
      dispatch(setLogout());
      if (navigate) navigate("/login");
    } finally {
      dispatch(setLoading(false));
    }
  };
}

export function updateChatProfile(formData: FormData) {
  return async function updateChatProfileThunk(dispatch) {
    dispatch(setStatus(STATUS.LOADING));
    dispatch(setLoading(true));
    try {
      const res = await service.updateProfile(formData);
      dispatch(setChatUserData(res.data));
      successHandler("Profile updated successfully");
      dispatch(setStatus(STATUS.IDLE));
      return res.data;
    } catch (error: any) {
      dispatch(setStatus(STATUS.ERROR));
      errorHandler(error.response);
    } finally {
      dispatch(setLoading(false));
    }
  };
}