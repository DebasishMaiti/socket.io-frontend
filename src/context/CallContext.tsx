import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { useSocketContext } from "@/context/SocketContext";
import {
  CallParticipant,
  CallStatus,
  CallType,
  IncomingCallPayload,
} from "@/types/call";
import {
  attachLocalTracks,
  createPeerConnection,
  generateRoomId,
  getDisplayMedia,
  getLocalMedia,
  getMediaErrorMessage,
  getOrCreateRemoteStream,
  getParticipantIds,
  normalizeUserId,
  shouldInitiateOffer,
} from "@/lib/webrtc";
import { toast } from "sonner";
import type { Socket } from "socket.io-client";

interface CallContextType {
  status: CallStatus;
  callType: CallType;
  roomId: string | null;
  conversationName: string;
  isIncoming: boolean;
  incomingCall: IncomingCallPayload | null;
  participants: CallParticipant[];
  localStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isScreenSharing: boolean;
  isLoadingMedia: boolean;
  permissionError: string | null;
  statusMessage: string;
  startCall: (conversation: unknown, type: CallType, displayName: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => Promise<void>;
  joinRoom: (roomId: string, conversationId: string, type: CallType, displayName: string) => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCallContext = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCallContext must be used within CallProvider");
  return ctx;
};

export const CallProvider = ({ children }: { children: ReactNode }) => {
  const { socket } = useSocketContext();
  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);

  const [status, setStatus] = useState<CallStatus>("idle");
  const [callType, setCallType] = useState<CallType>("video");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [conversationName, setConversationName] = useState("");
  const [isIncoming, setIsIncoming] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const makingOfferRef = useRef<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const callTypeRef = useRef<CallType>("video");
  const statusRef = useRef<CallStatus>("idle");
  const socketRef = useRef<Socket | null>(null);

  const authUserId = normalizeUserId(authUser?._id);
  const authUserName = authUser?.name || "You";

  statusRef.current = status;
  socketRef.current = socket;
  callTypeRef.current = callType;

  const addOrUpdateParticipant = useCallback(
    (userId: string, name: string, stream?: MediaStream) => {
      const uid = normalizeUserId(userId);
      setParticipants((prev) => {
        const exists = prev.find((p) => p.userId === uid);
        if (exists) {
          return prev.map((p) =>
            p.userId === uid ? { ...p, name, stream: stream ?? p.stream } : p
          );
        }
        return [...prev, { userId: uid, name, stream, isMuted: false, isVideoOff: false }];
      });
    },
    []
  );

  const updateParticipantStream = useCallback((userId: string, stream: MediaStream) => {
    const uid = normalizeUserId(userId);
    remoteStreamsRef.current.set(uid, stream);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === uid ? { ...p, stream } : p))
    );
  }, []);

  const removeParticipant = useCallback((userId: string) => {
    const uid = normalizeUserId(userId);
    setParticipants((prev) => prev.filter((p) => p.userId !== uid));
    const pc = peerConnectionsRef.current.get(uid);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(uid);
    }
    remoteStreamsRef.current.delete(uid);
    pendingCandidatesRef.current.delete(uid);
    makingOfferRef.current.delete(uid);
  }, []);

  const stopAllMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    cameraStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setIsScreenSharing(false);
  }, []);

  const closeAllPeers = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingCandidatesRef.current.clear();
    makingOfferRef.current.clear();
  }, []);

  const resetCall = useCallback(() => {
    closeAllPeers();
    stopAllMedia();
    setStatus("idle");
    statusRef.current = "idle";
    setRoomId(null);
    roomIdRef.current = null;
    setConversationName("");
    setIsIncoming(false);
    setIncomingCall(null);
    setParticipants([]);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsSpeakerOn(true);
    setPermissionError(null);
    setStatusMessage("");
    setIsLoadingMedia(false);
  }, [closeAllPeers, stopAllMedia]);

  const flushPendingCandidates = useCallback(async (remoteUserId: string, pc: RTCPeerConnection) => {
    const uid = normalizeUserId(remoteUserId);
    const pending = pendingCandidatesRef.current.get(uid) || [];
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("ICE candidate error:", e);
      }
    }
    pendingCandidatesRef.current.delete(uid);
  }, []);

  const setupPeerConnection = useCallback(
    (remoteUserId: string) => {
      const uid = normalizeUserId(remoteUserId);
      let pc = peerConnectionsRef.current.get(uid);
      if (pc) return pc;

      pc = createPeerConnection();
      peerConnectionsRef.current.set(uid, pc);

      attachLocalTracks(pc, localStreamRef.current);

      pc.ontrack = (event) => {
        const stream = getOrCreateRemoteStream(remoteStreamsRef.current, uid, event);
        updateParticipantStream(uid, stream);
        setStatus("connected");
        statusRef.current = "connected";
        setStatusMessage("Connected");
      };

      pc.onicecandidate = (event) => {
        if (!event.candidate || !socketRef.current || !roomIdRef.current) return;
        socketRef.current.emit("webrtc:ice-candidate", {
          roomId: roomIdRef.current,
          toUserId: uid,
          fromUserId: authUserId,
          candidate: event.candidate.toJSON(),
        });
      };

      pc.onconnectionstatechange = () => {
        if (pc!.connectionState === "failed") {
          try {
            pc!.restartIce();
          } catch {
            removeParticipant(uid);
            setStatusMessage("Connection failed");
          }
        } else if (pc!.connectionState === "disconnected") {
          removeParticipant(uid);
          setStatusMessage("User disconnected");
        }
      };

      return pc;
    },
    [authUserId, updateParticipantStream, removeParticipant]
  );

  const createOfferForPeer = useCallback(
    async (remoteUserId: string, remoteName?: string) => {
      const socket = socketRef.current;
      const uid = normalizeUserId(remoteUserId);
      if (!socket || !roomIdRef.current || !uid || uid === authUserId) return;
      if (!shouldInitiateOffer(authUserId, uid)) return;
      if (makingOfferRef.current.has(uid)) return;

      makingOfferRef.current.add(uid);
      if (remoteName) addOrUpdateParticipant(uid, remoteName);

      try {
        const pc = setupPeerConnection(uid);
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callTypeRef.current === "video",
        });
        await pc.setLocalDescription(offer);
        socket.emit("webrtc:offer", {
          roomId: roomIdRef.current,
          toUserId: uid,
          fromUserId: authUserId,
          sdp: offer,
        });
      } catch (err) {
        console.error("createOffer error:", err);
        makingOfferRef.current.delete(uid);
      }
    },
    [authUserId, setupPeerConnection, addOrUpdateParticipant]
  );

  const handleRemoteOffer = useCallback(
    async (fromUserId: string, sdp: RTCSessionDescriptionInit, callerName?: string) => {
      const socket = socketRef.current;
      const uid = normalizeUserId(fromUserId);
      if (!socket || !roomIdRef.current || !uid || uid === authUserId) return;

      if (callerName) addOrUpdateParticipant(uid, callerName);

      const pc = setupPeerConnection(uid);

      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setLocalDescription({ type: "rollback" } as RTCSessionDescriptionInit);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingCandidates(uid, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc:answer", {
          roomId: roomIdRef.current,
          toUserId: uid,
          fromUserId: authUserId,
          sdp: answer,
        });
      } catch (err) {
        console.error("handleRemoteOffer error:", err);
      }
    },
    [authUserId, setupPeerConnection, addOrUpdateParticipant, flushPendingCandidates]
  );

  const handleRemoteAnswer = useCallback(
    async (fromUserId: string, sdp: RTCSessionDescriptionInit) => {
      const uid = normalizeUserId(fromUserId);
      const pc = peerConnectionsRef.current.get(uid);
      if (!pc) return;

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        await flushPendingCandidates(uid, pc);
        makingOfferRef.current.delete(uid);
        setStatus("connected");
        statusRef.current = "connected";
        setStatusMessage("Connected");
      } catch (err) {
        console.error("handleRemoteAnswer error:", err);
      }
    },
    [flushPendingCandidates]
  );

  const negotiateWithPeers = useCallback(
    async (list: { userId: string; name: string }[], onlyNewUserId?: string) => {
      for (const p of list) {
        const uid = normalizeUserId(p.userId);
        if (!uid || uid === authUserId) continue;
        if (onlyNewUserId && uid !== normalizeUserId(onlyNewUserId)) continue;

        addOrUpdateParticipant(uid, p.name);

        if (shouldInitiateOffer(authUserId, uid)) {
          await createOfferForPeer(uid, p.name);
        }
      }
    },
    [authUserId, addOrUpdateParticipant, createOfferForPeer]
  );

  const setupLocalStream = useCallback(async (withVideo: boolean) => {
    setIsLoadingMedia(true);
    setPermissionError(null);
    try {
      const stream = await getLocalMedia(withVideo);
      cameraStreamRef.current = stream;
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsVideoOff(!withVideo);
      addOrUpdateParticipant(authUserId, authUserName, stream);

      peerConnectionsRef.current.forEach((pc) => {
        attachLocalTracks(pc, stream);
      });

      return stream;
    } catch (err) {
      const msg = getMediaErrorMessage(err);
      setPermissionError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsLoadingMedia(false);
    }
  }, [authUserId, authUserName, addOrUpdateParticipant]);

  const endCall = useCallback(() => {
    if (socketRef.current && roomIdRef.current) {
      socketRef.current.emit("call:end", { roomId: roomIdRef.current, userName: authUserName });
    }
    setStatus("ended");
    setStatusMessage("Call ended");
    setTimeout(resetCall, 600);
  }, [authUserName, resetCall]);

  const startCall = useCallback(
    async (conversation: { _id?: unknown; participants?: unknown[] }, type: CallType, displayName: string) => {
      const socket = socketRef.current;
      if (!socket || !authUserId) {
        toast.error("Not connected");
        return;
      }
      if (statusRef.current !== "idle") {
        toast.error("Already in a call");
        return;
      }

      const convId = normalizeUserId(conversation._id);
      const participantIds = getParticipantIds(conversation, authUserId);
      if (participantIds.length === 0) {
        toast.error("No participants to call");
        return;
      }

      const newRoomId = generateRoomId(convId);
      roomIdRef.current = newRoomId;
      callTypeRef.current = type;

      setRoomId(newRoomId);
      setConversationName(displayName);
      setCallType(type);
      setStatus("calling");
      statusRef.current = "calling";
      setStatusMessage("Calling...");
      setIsIncoming(false);

      try {
        await setupLocalStream(type === "video");
      } catch {
        resetCall();
        return;
      }

      const allParticipants = [authUserId, ...participantIds.map(normalizeUserId)];
      socket.emit("call:invite", {
        roomId: newRoomId,
        conversationId: convId,
        participants: allParticipants,
        callType: type,
        callerName: authUserName,
      });
    },
    [authUserId, authUserName, setupLocalStream, resetCall]
  );

  const acceptCall = useCallback(async () => {
    const socket = socketRef.current;
    const call = incomingCall;
    if (!socket || !call || !authUserId) return;

    const rId = call.roomId;
    const type = call.callType;
    roomIdRef.current = rId;
    callTypeRef.current = type;

    setRoomId(rId);
    setCallType(type);
    setStatus("connected");
    statusRef.current = "connected";
    setStatusMessage("Connecting...");
    setIsIncoming(false);
    setIncomingCall(null);

    addOrUpdateParticipant(normalizeUserId(call.callerId), call.callerName);

    try {
      await setupLocalStream(type === "video");
    } catch {
      socket.emit("call:reject", { roomId: rId, userName: authUserName });
      resetCall();
      return;
    }

    socket.emit("call:accept", { roomId: rId, userName: authUserName });
  }, [incomingCall, authUserId, authUserName, setupLocalStream, resetCall, addOrUpdateParticipant]);

  const rejectCall = useCallback(() => {
    const socket = socketRef.current;
    const call = incomingCall;
    if (socket && call) {
      socket.emit("call:reject", { roomId: call.roomId, userName: authUserName });
    }
    resetCall();
  }, [incomingCall, authUserName, resetCall]);

  const joinRoom = useCallback(
    async (rId: string, convId: string, type: CallType, displayName: string) => {
      const socket = socketRef.current;
      if (!socket || !authUserId) return;

      roomIdRef.current = rId;
      callTypeRef.current = type;
      setRoomId(rId);
      setConversationName(displayName);
      setCallType(type);
      setStatus("connected");
      statusRef.current = "connected";
      setStatusMessage("Joining...");

      try {
        await setupLocalStream(type === "video");
      } catch {
        resetCall();
        return;
      }

      socket.emit("call:join", {
        roomId: rId,
        userName: authUserName,
        conversationId: convId,
        callType: type,
      });
    },
    [authUserId, authUserName, setupLocalStream, resetCall]
  );

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isMuted;
    stream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setIsMuted(next);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === authUserId ? { ...p, isMuted: next } : p))
    );
  }, [isMuted, authUserId]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const next = !isVideoOff;
    stream.getVideoTracks().forEach((t) => (t.enabled = !next));
    setIsVideoOff(next);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === authUserId ? { ...p, isVideoOff: next } : p))
    );
  }, [isVideoOff, authUserId]);

  const toggleSpeaker = useCallback(() => setIsSpeakerOn((p) => !p), []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (cameraStreamRef.current) {
        localStreamRef.current = cameraStreamRef.current;
        setLocalStream(cameraStreamRef.current);
        const camTrack = cameraStreamRef.current.getVideoTracks()[0];
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender && camTrack) sender.replaceTrack(camTrack);
        });
      }
      setIsScreenSharing(false);
      return;
    }

    try {
      const screenStream = await getDisplayMedia();
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];
      screenTrack.onended = () => toggleScreenShare();

      localStreamRef.current = screenStream;
      setLocalStream(screenStream);
      setIsScreenSharing(true);

      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && screenTrack) sender.replaceTrack(screenTrack);
      });
    } catch {
      toast.error("Screen sharing cancelled");
    }
  }, [isScreenSharing]);

  useEffect(() => {
    if (!socket || !authUserId) return;

    const onIncoming = (payload: IncomingCallPayload) => {
      if (statusRef.current !== "idle") return;

      setIncomingCall({
        ...payload,
        callerId: normalizeUserId(payload.callerId),
        participants: payload.participants.map(normalizeUserId),
      });
      setIsIncoming(true);
      setStatus("ringing");
      statusRef.current = "ringing";
      setStatusMessage("Ringing...");
      setCallType(payload.callType);
      callTypeRef.current = payload.callType;
      setConversationName(payload.callerName);
      setRoomId(payload.roomId);
      roomIdRef.current = payload.roomId;
    };

    const onUserJoined = async ({
      userId,
      userName,
      participants: list,
    }: {
      userId: string;
      userName: string;
      participants: { userId: string; name: string }[];
    }) => {
      const uid = normalizeUserId(userId);
      if (!uid || uid === authUserId) return;

      setStatus("connected");
      statusRef.current = "connected";
      setStatusMessage(`${userName} joined`);

      await negotiateWithPeers(list, uid);
    };

    const onUserLeft = ({ userId, userName }: { userId: string; userName: string }) => {
      removeParticipant(userId);
      setStatusMessage(`${userName || "User"} left`);
    };

    const onCallEnded = (payload?: { reason?: string }) => {
      if (payload?.reason === "room_not_found") {
        toast.error("Call is no longer available");
      } else {
        toast.info("Call ended");
      }
      resetCall();
    };

    const onRejected = () => {
      toast.info("Call declined");
      setStatusMessage("Call declined");
      resetCall();
    };

    const onAccepted = async ({
      participants: list,
    }: {
      participants: { userId: string; name: string }[];
    }) => {
      setStatus("connected");
      statusRef.current = "connected";
      setStatusMessage("Connected");
      await negotiateWithPeers(list);
    };

    const onJoined = async ({
      participants: list,
    }: {
      participants: { userId: string; name: string }[];
    }) => {
      setStatus("connected");
      statusRef.current = "connected";
      setStatusMessage("Connected");
      await negotiateWithPeers(list);
    };

    const onOffer = async ({
      fromUserId,
      sdp,
    }: {
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      await handleRemoteOffer(fromUserId, sdp);
    };

    const onAnswer = async ({
      fromUserId,
      sdp,
    }: {
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      await handleRemoteAnswer(fromUserId, sdp);
    };

    const onIce = async ({
      fromUserId,
      candidate,
    }: {
      fromUserId: string;
      candidate: RTCIceCandidateInit | null;
    }) => {
      if (!candidate) return;
      const uid = normalizeUserId(fromUserId);
      const pc = peerConnectionsRef.current.get(uid);
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("addIceCandidate:", e);
        }
      } else {
        const pending = pendingCandidatesRef.current.get(uid) || [];
        pending.push(candidate);
        pendingCandidatesRef.current.set(uid, pending);
      }
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:user-joined", onUserJoined);
    socket.on("call:user-left", onUserLeft);
    socket.on("call:ended", onCallEnded);
    socket.on("call:rejected", onRejected);
    socket.on("call:accepted", onAccepted);
    socket.on("call:joined", onJoined);
    socket.on("webrtc:offer", onOffer);
    socket.on("webrtc:answer", onAnswer);
    socket.on("webrtc:ice-candidate", onIce);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:user-joined", onUserJoined);
      socket.off("call:user-left", onUserLeft);
      socket.off("call:ended", onCallEnded);
      socket.off("call:rejected", onRejected);
      socket.off("call:accepted", onAccepted);
      socket.off("call:joined", onJoined);
      socket.off("webrtc:offer", onOffer);
      socket.off("webrtc:answer", onAnswer);
      socket.off("webrtc:ice-candidate", onIce);
    };
  }, [
    socket,
    authUserId,
    negotiateWithPeers,
    handleRemoteOffer,
    handleRemoteAnswer,
    removeParticipant,
    resetCall,
  ]);

  return (
    <CallContext.Provider
      value={{
        status,
        callType,
        roomId,
        conversationName,
        isIncoming,
        incomingCall,
        participants,
        localStream,
        isMuted,
        isVideoOff,
        isSpeakerOn,
        isScreenSharing,
        isLoadingMedia,
        permissionError,
        statusMessage,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        toggleScreenShare,
        joinRoom,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
