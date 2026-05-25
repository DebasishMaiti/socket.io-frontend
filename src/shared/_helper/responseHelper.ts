import { Capacitor } from "@capacitor/core";
import { Toast } from "@capacitor/toast";
import { toast as sonnerToast } from "sonner";
import { sessionService } from "../_session";
import { localService } from "../_session/local";

const isNative = Capacitor.isNativePlatform();

export const errorHandler = async (res) => {
  if (res.status === 401) {
    // sessionService.clearAll();
    // localService.clearAll();
    // window.location.href = "/";
  }

  const message = Array.isArray(res.data.message)
    ? res.data.message[0]
    : res.data.message;

  if (isNative) {
    await Toast.show({
      text: message,
      duration: "short",
    });
  } else {
    sonnerToast.error(message, {duration: 700});
  }
};

export const successHandler = async (msg) => {
  if (isNative) {
    await Toast.show({
      text: msg,
      duration: "short",
    });
  } else {
    sonnerToast.success(msg, {duration: 700});
  }
};

export const warningHandler = async (msg) => {
  if (isNative) {
    await Toast.show({
      text: msg,
      duration: "short",
    });
  } else {
    sonnerToast.warning(msg,{duration: 700});
  }
};
