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
  createPeerConnection,
  generateRoomId,
  getLocalMedia,
  getDisplayMedia,
  getMediaErrorMessage,
  getParticipantIds,
} from "@/lib/webrtc";
import { toast } from "sonner";

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
  startCall: (conversation: any, type: CallType, displayName: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => Promise<void>;
  joinRoom: (roomId: string, conversationId: string, callType: CallType, displayName: string) => Promise<void>;
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
  const [conversationId, setConversationId] = useState<string | null>(null);
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
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const isCallerRef = useRef(false);
  const roomIdRef = useRef<string | null>(null);

  const authUserId = authUser?._id ? String(authUser._id) : "";
  const authUserName = authUser?.name || "You";

  const updateParticipantStream = useCallback(
    (userId: string, stream: MediaStream | undefined) => {
      setParticipants((prev) =>
        prev.map((p) => (p.userId === userId ? { ...p, stream } : p))
      );
    },
    []
  );

  const addOrUpdateParticipant = useCallback(
    (userId: string, name: string, stream?: MediaStream) => {
      setParticipants((prev) => {
        const exists = prev.find((p) => p.userId === userId);
        if (exists) {
          return prev.map((p) =>
            p.userId === userId ? { ...p, name, stream: stream ?? p.stream } : p
          );
        }
        return [...prev, { userId, name, stream, isMuted: false, isVideoOff: false }];
      });
    },
    []
  );

  const removeParticipant = useCallback((userId: string) => {
    setParticipants((prev) => prev.filter((p) => p.userId !== userId));
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    pendingCandidatesRef.current.delete(userId);
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
    pendingCandidatesRef.current.clear();
  }, []);

  const resetCall = useCallback(() => {
    closeAllPeers();
    stopAllMedia();
    setStatus("idle");
    setRoomId(null);
    roomIdRef.current = null;
    setConversationId(null);
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
    isCallerRef.current = false;
  }, [closeAllPeers, stopAllMedia]);

  const flushPendingCandidates = useCallback(async (remoteUserId: string, pc: RTCPeerConnection) => {
    const pending = pendingCandidatesRef.current.get(remoteUserId) || [];
    for (const candidate of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    pendingCandidatesRef.current.delete(remoteUserId);
  }, []);

  const createOfferForPeer = useCallback(
    async (remoteUserId: string) => {
      if (!socket || !roomIdRef.current || remoteUserId === authUserId) return;
      if (peerConnectionsRef.current.has(remoteUserId)) return;

      const pc = createPeerConnection();
      peerConnectionsRef.current.set(remoteUserId, pc);

      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) updateParticipantStream(remoteUserId, remoteStream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            roomId: roomIdRef.current,
            toUserId: remoteUserId,
            fromUserId: authUserId,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          removeParticipant(remoteUserId);
          setStatusMessage("User disconnected");
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("webrtc:offer", {
        roomId: roomIdRef.current,
        toUserId: remoteUserId,
        fromUserId: authUserId,
        sdp: offer,
      });
    },
    [socket, authUserId, updateParticipantStream, removeParticipant]
  );

  const handleRemoteOffer = useCallback(
    async (fromUserId: string, sdp: RTCSessionDescriptionInit) => {
      if (!socket || !roomIdRef.current || fromUserId === authUserId) return;

      let pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) {
        pc = createPeerConnection();
        peerConnectionsRef.current.set(fromUserId, pc);

        const stream = localStreamRef.current;
        if (stream) {
          stream.getTracks().forEach((track) => pc!.addTrack(track, stream));
        }

        pc.ontrack = (event) => {
          const [remoteStream] = event.streams;
          if (remoteStream) updateParticipantStream(fromUserId, remoteStream);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("webrtc:ice-candidate", {
              roomId: roomIdRef.current,
              toUserId: fromUserId,
              fromUserId: authUserId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc!.connectionState === "disconnected" || pc!.connectionState === "failed") {
            removeParticipant(fromUserId);
          }
        };
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingCandidates(fromUserId, pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", {
        roomId: roomIdRef.current,
        toUserId: fromUserId,
        fromUserId: authUserId,
        sdp: answer,
      });
    },
    [socket, authUserId, updateParticipantStream, removeParticipant, flushPendingCandidates]
  );

  const handleRemoteAnswer = useCallback(
    async (fromUserId: string, sdp: RTCSessionDescriptionInit) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushPendingCandidates(fromUserId, pc);
      setStatus("connected");
      setStatusMessage("Connected");
    },
    [flushPendingCandidates]
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

  const connectToExistingParticipants = useCallback(
    async (list: { userId: string; name: string }[]) => {
      for (const p of list) {
        if (p.userId !== authUserId) {
          addOrUpdateParticipant(p.userId, p.name);
          await createOfferForPeer(p.userId);
        }
      }
    },
    [authUserId, addOrUpdateParticipant, createOfferForPeer]
  );

  const endCall = useCallback(() => {
    if (socket && roomIdRef.current) {
      socket.emit("call:end", { roomId: roomIdRef.current, userName: authUserName });
    }
    setStatus("ended");
    setStatusMessage("Call ended");
    setTimeout(resetCall, 800);
  }, [socket, authUserName, resetCall]);

  const startCall = useCallback(
    async (conversation: any, type: CallType, displayName: string) => {
      if (!socket || !authUserId) return;

      const convId = String(conversation._id);
      const participantIds = getParticipantIds(conversation, authUserId);
      if (participantIds.length === 0) {
        toast.error("No participants to call");
        return;
      }

      const newRoomId = generateRoomId(convId);
      roomIdRef.current = newRoomId;
      isCallerRef.current = true;

      setRoomId(newRoomId);
      setConversationId(convId);
      setConversationName(displayName);
      setCallType(type);
      setStatus("calling");
      setStatusMessage("Calling...");
      setIsIncoming(false);

      try {
        await setupLocalStream(type === "video");
      } catch {
        resetCall();
        return;
      }

      const allParticipants = [authUserId, ...participantIds];
      socket.emit("call:invite", {
        roomId: newRoomId,
        conversationId: convId,
        participants: allParticipants,
        callType: type,
        callerName: authUserName,
      });
    },
    [socket, authUserId, authUserName, setupLocalStream, resetCall]
  );

  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall || !authUserId) return;

    const { roomId: rId, callType: type, callerId, callerName } = incomingCall;
    roomIdRef.current = rId;
    setRoomId(rId);
    setConversationId(incomingCall.conversationId);
    setCallType(type);
    setStatus("connected");
    setStatusMessage("Connected");
    setIsIncoming(false);
    setIncomingCall(null);
    isCallerRef.current = false;

    addOrUpdateParticipant(callerId, callerName);

    try {
      await setupLocalStream(type === "video");
    } catch {
      socket.emit("call:reject", { roomId: rId, userName: authUserName });
      resetCall();
      return;
    }

    socket.emit("call:accept", { roomId: rId, userName: authUserName });
  }, [socket, incomingCall, authUserId, authUserName, setupLocalStream, resetCall, addOrUpdateParticipant]);

  const rejectCall = useCallback(() => {
    if (socket && incomingCall) {
      socket.emit("call:reject", {
        roomId: incomingCall.roomId,
        userName: authUserName,
      });
    }
    setStatusMessage("Call declined");
    resetCall();
  }, [socket, incomingCall, authUserName, resetCall]);

  const joinRoom = useCallback(
    async (rId: string, convId: string, type: CallType, displayName: string) => {
      if (!socket || !authUserId) return;
      roomIdRef.current = rId;
      setRoomId(rId);
      setConversationId(convId);
      setConversationName(displayName);
      setCallType(type);
      setStatus("connected");
      setStatusMessage("Joining room...");

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
    [socket, authUserId, authUserName, setupLocalStream, resetCall]
  );

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    const next = !isMuted;
    audioTracks.forEach((t) => (t.enabled = !next));
    setIsMuted(next);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === authUserId ? { ...p, isMuted: next } : p))
    );
  }, [isMuted, authUserId]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    const next = !isVideoOff;
    videoTracks.forEach((t) => (t.enabled = !next));
    setIsVideoOff(next);
    setParticipants((prev) =>
      prev.map((p) => (p.userId === authUserId ? { ...p, isVideoOff: next } : p))
    );
  }, [isVideoOff, authUserId]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (cameraStreamRef.current) {
        localStreamRef.current = cameraStreamRef.current;
        setLocalStream(cameraStreamRef.current);
        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");
          const camTrack = cameraStreamRef.current?.getVideoTracks()[0];
          if (videoSender && camTrack) videoSender.replaceTrack(camTrack);
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
      toast.error("Screen sharing cancelled or not supported");
    }
  }, [isScreenSharing]);

  useEffect(() => {
    if (!socket || !authUserId) return;

    const onIncoming = (payload: IncomingCallPayload) => {
      if (status !== "idle" && roomIdRef.current) return;
      setIncomingCall(payload);
      setIsIncoming(true);
      setStatus("ringing");
      setStatusMessage("Ringing...");
      setCallType(payload.callType);
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
      if (userId === authUserId) return;

      addOrUpdateParticipant(userId, userName);
      setStatus("connected");
      setStatusMessage(`${userName} joined`);

      if (isCallerRef.current || status === "connected" || status === "calling") {
        await createOfferForPeer(userId);
      }

      list.forEach((p) => {
        if (p.userId !== authUserId && p.userId !== userId) {
          addOrUpdateParticipant(p.userId, p.name);
        }
      });
    };

    const onUserLeft = ({
      userId,
      userName,
    }: {
      userId: string;
      userName: string;
    }) => {
      removeParticipant(userId);
      setStatusMessage(`${userName} left`);
    };

    const onCallEnded = () => {
      setStatusMessage("Call ended");
      resetCall();
    };

    const onRejected = () => {
      setStatusMessage("Call declined");
      toast.info("Call declined");
      resetCall();
    };

    const onAccepted = async ({
      participants: list,
    }: {
      participants: { userId: string; name: string }[];
    }) => {
      setStatus("connected");
      setStatusMessage("Connected");
      await connectToExistingParticipants(list);
    };

    const onJoined = async ({
      participants: list,
    }: {
      participants: { userId: string; name: string }[];
    }) => {
      setStatus("connected");
      setStatusMessage("Connected");
      await connectToExistingParticipants(list);
    };

    const onOffer = async ({
      fromUserId,
      sdp,
    }: {
      fromUserId: string;
      sdp: RTCSessionDescriptionInit;
    }) => {
      addOrUpdateParticipant(fromUserId, "Participant");
      await handleRemoteOffer(fromUserId, sdp);
      setStatus("connected");
      setStatusMessage("Connected");
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
      candidate: RTCIceCandidateInit;
    }) => {
      const pc = peerConnectionsRef.current.get(fromUserId);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        const pending = pendingCandidatesRef.current.get(fromUserId) || [];
        pending.push(candidate);
        pendingCandidatesRef.current.set(fromUserId, pending);
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
    status,
    participants.length,
    addOrUpdateParticipant,
    removeParticipant,
    createOfferForPeer,
    handleRemoteOffer,
    handleRemoteAnswer,
    connectToExistingParticipants,
    endCall,
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
