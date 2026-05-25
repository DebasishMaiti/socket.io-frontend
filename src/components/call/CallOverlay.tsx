import { useEffect, useRef, type ReactNode } from "react";
import { useCallContext } from "@/context/CallContext";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { normalizeUserId } from "@/lib/webrtc";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Monitor,
  MonitorOff,
  Loader2,
  Phone,
  PhoneIncoming,
} from "lucide-react";

function playMedia(el: HTMLMediaElement | null) {
  if (!el) return;
  el.play().catch(() => {});
}

const CallOverlay = () => {
  const {
    status,
    callType,
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
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    toggleSpeaker,
    toggleScreenShare,
  } = useCallContext();

  const { chatUser: authUser } = useSelector((state: RootState) => state.auth);
  const authUserId = normalizeUserId(authUser?._id);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteMediaRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      el.srcObject = localStream;
      playMedia(el);
    }
  }, [localStream]);

  useEffect(() => {
    participants.forEach((p) => {
      const el = remoteMediaRefs.current.get(p.userId);
      if (el && p.stream) {
        el.srcObject = p.stream;
        el.muted = !isSpeakerOn;
        playMedia(el);
      }
    });
  }, [participants, isSpeakerOn]);

  if (status === "idle") return null;

  const remoteParticipants = participants.filter((p) => p.userId !== authUserId);
  const showLocalVideo = callType === "video" && localStream && !isVideoOff;
  const gridCols =
    remoteParticipants.length <= 1
      ? "grid-cols-1"
      : remoteParticipants.length <= 4
        ? "grid-cols-2"
        : "grid-cols-3";

  if (isIncoming && status === "ringing") {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <PhoneIncoming size={40} className="text-green-500" />
          </div>
          <p className="text-xs text-green-400 font-medium uppercase tracking-wider mb-1">
            {statusMessage || "Ringing..."}
          </p>
          <h2 className="text-xl font-bold text-white mb-1">
            {incomingCall?.callerName || conversationName}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Incoming {incomingCall?.callType === "video" ? "video" : "audio"} call
          </p>
          <div className="flex gap-3">
            <button
              onClick={rejectCall}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium flex items-center justify-center gap-2"
            >
              <PhoneOff size={18} />
              Decline
            </button>
            <button
              onClick={acceptCall}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-medium flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#0a0a0a]">
      <div className="px-4 py-3 bg-[#1e1e1e] border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-semibold">{conversationName}</h2>
          <p className="text-xs text-gray-400 capitalize">
            {permissionError || statusMessage || status}
            {isLoadingMedia && " · Loading media..."}
          </p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
          {remoteParticipants.length + 1} in call
        </span>
      </div>

      {permissionError && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {permissionError}
        </div>
      )}

      <div className="flex-1 relative p-4 overflow-hidden min-h-0">
        {isLoadingMedia && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <span className="ml-3 text-white">Accessing camera & microphone...</span>
          </div>
        )}

        <div className={`h-full grid ${gridCols} gap-3`}>
          {remoteParticipants.length === 0 && (status === "calling" || status === "connected") && (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-400 min-h-[200px]">
              <Loader2 className="animate-spin mb-3" size={32} />
              <p>{status === "calling" ? "Calling..." : "Waiting for others..."}</p>
            </div>
          )}

          {remoteParticipants.map((p) => (
            <div
              key={p.userId}
              className="relative rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/10 min-h-[160px] aspect-video"
            >
              {p.stream ? (
                <video
                  ref={(el) => {
                    if (el) remoteMediaRefs.current.set(p.userId, el);
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover bg-black"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40 min-h-[160px]">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
                    {p.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white text-sm font-medium truncate">{p.name}</p>
                {p.isMuted && <span className="text-[10px] text-red-400">Muted</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl bg-[#1a1a1a] z-20">
          {showLocalVideo ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#252525] gap-2">
              <span className="text-lg font-bold text-white">
                {authUser?.name?.charAt(0).toUpperCase() || "You"}
              </span>
              {localStream && (
                <span className="text-[10px] text-gray-400">Audio only</span>
              )}
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60">
            <p className="text-white text-xs truncate">{authUser?.name || "You"} (You)</p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-4 py-5 bg-[#1e1e1e] border-t border-white/5">
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap max-w-lg mx-auto">
          <ControlButton
            onClick={toggleMute}
            active={isMuted}
            label={isMuted ? "Unmute" : "Mute"}
            icon={isMuted ? <MicOff size={22} /> : <Mic size={22} />}
          />
          {callType === "video" && (
            <ControlButton
              onClick={toggleVideo}
              active={isVideoOff}
              label={isVideoOff ? "Camera on" : "Camera off"}
              icon={isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
            />
          )}
          <ControlButton
            onClick={toggleSpeaker}
            active={!isSpeakerOn}
            label={isSpeakerOn ? "Speaker off" : "Speaker on"}
            icon={isSpeakerOn ? <Volume2 size={22} /> : <VolumeX size={22} />}
          />
          {callType === "video" && (
            <ControlButton
              onClick={toggleScreenShare}
              active={isScreenSharing}
              label={isScreenSharing ? "Stop share" : "Share screen"}
              icon={isScreenSharing ? <MonitorOff size={22} /> : <Monitor size={22} />}
            />
          )}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg"
            title="End call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      </div>

      <style>{`.mirror { transform: scaleX(-1); }`}</style>
    </div>
  );
};

const ControlButton = ({
  onClick,
  active,
  label,
  icon,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  icon: ReactNode;
}) => (
  <button
    onClick={onClick}
    title={label}
    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-colors ${
      active
        ? "bg-red-500/20 text-red-400 border border-red-500/30"
        : "bg-white/10 text-white hover:bg-white/20"
    }`}
  >
    {icon}
  </button>
);

export default CallOverlay;
