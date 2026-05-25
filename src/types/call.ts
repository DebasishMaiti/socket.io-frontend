export type CallType = "audio" | "video";
export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended";

export interface CallParticipant {
  userId: string;
  name: string;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

export interface IncomingCallPayload {
  roomId: string;
  conversationId: string;
  callType: CallType;
  callerId: string;
  callerName: string;
  participants: string[];
}
