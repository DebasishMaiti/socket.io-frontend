export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({ iceServers: ICE_SERVERS });
}

export async function getLocalMedia(
  withVideo: boolean
): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: withVideo ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } : false,
  });
}

export async function getDisplayMedia(): Promise<MediaStream> {
  return navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
  });
}

export function getMediaErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Camera/microphone permission denied. Please allow access in browser settings.";
    }
    if (error.name === "NotFoundError") {
      return "No camera or microphone found on this device.";
    }
    if (error.name === "NotReadableError") {
      return "Camera or microphone is already in use by another application.";
    }
  }
  return "Could not access camera or microphone.";
}

export function generateRoomId(conversationId: string): string {
  return `room_${conversationId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function getParticipantIds(
  conversation: any,
  authUserId: string
): string[] {
  if (conversation?.participants?.length) {
    return conversation.participants
      .map((p: any) => String(typeof p === "string" ? p : p._id))
      .filter((id: string) => id && id !== authUserId);
  }
  const otherId = String(conversation?._id);
  if (otherId && otherId !== authUserId) {
    return [otherId];
  }
  return [];
}
