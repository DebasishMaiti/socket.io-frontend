export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

export function normalizeUserId(id: unknown): string {
  if (id == null) return "";
  return String(id);
}

export function createPeerConnection(): RTCPeerConnection {
  return new RTCPeerConnection({
    iceServers: ICE_SERVERS,
    iceCandidatePoolSize: 10,
  });
}

export async function getLocalMedia(withVideo: boolean): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("NotSupportedError", "getUserMedia is not supported");
  }
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: withVideo
      ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
      : false,
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
    if (error.name === "NotSupportedError") {
      return "Calls are not supported in this browser.";
    }
  }
  return "Could not access camera or microphone.";
}

export function generateRoomId(conversationId: string): string {
  return `room_${conversationId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Who should send the WebRTC offer (avoids glare when both sides offer). */
export function shouldInitiateOffer(localUserId: string, remoteUserId: string): boolean {
  return normalizeUserId(localUserId) < normalizeUserId(remoteUserId);
}

export function getParticipantIds(
  conversation: { _id?: unknown; participants?: unknown[] },
  authUserId: string
): string[] {
  const self = normalizeUserId(authUserId);

  if (conversation?.participants?.length) {
    return conversation.participants
      .map((p: unknown) =>
        normalizeUserId(typeof p === "string" ? p : (p as { _id?: unknown })?._id)
      )
      .filter((id) => id && id !== self);
  }

  const otherId = normalizeUserId(conversation?._id);
  if (otherId && otherId !== self) {
    return [otherId];
  }
  return [];
}

export function attachLocalTracks(pc: RTCPeerConnection, stream: MediaStream | null) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    const hasTrack = pc.getSenders().some((s) => s.track?.id === track.id);
    if (!hasTrack) {
      pc.addTrack(track, stream);
    }
  });
}

export function getOrCreateRemoteStream(
  map: Map<string, MediaStream>,
  userId: string,
  event: RTCTrackEvent
): MediaStream {
  let stream = event.streams?.[0] ?? map.get(userId);
  if (!stream) {
    stream = new MediaStream();
    map.set(userId, stream);
  }
  if (event.track && !stream.getTracks().some((t) => t.id === event.track.id)) {
    stream.addTrack(event.track);
  }
  return stream;
}
