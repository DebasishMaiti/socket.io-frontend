import { cn } from "@/lib/utils";
import type { CallParticipant } from "@/types/call";

type RemoteParticipantTileProps = {
  participant: CallParticipant;
  videoRef: (el: HTMLVideoElement | null) => void;
  fullscreen?: boolean;
};

export default function RemoteParticipantTile({
  participant,
  videoRef,
  fullscreen = false,
}: RemoteParticipantTileProps) {
  const { stream, name, isMuted, userId } = participant;

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-[#1a1a1a] border border-white/10",
        fullscreen
          ? "absolute inset-0 w-full h-full rounded-none border-0"
          : "rounded-xl min-h-0 h-full w-full"
      )}
    >
      {stream ? (
        <video
          key={userId}
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-black"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/40 to-purple-900/40",
            fullscreen ? "min-h-full" : "min-h-[120px]"
          )}
        >
          <div
            className={cn(
              "rounded-full bg-white/10 flex items-center justify-center font-bold text-white",
              fullscreen ? "w-28 h-28 text-4xl" : "w-16 h-16 text-2xl"
            )}
          >
            {name?.charAt(0).toUpperCase() || "?"}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
        <p className="text-white text-sm font-medium truncate">{name}</p>
        {isMuted && <span className="text-[10px] text-red-400">Muted</span>}
      </div>
    </div>
  );
}
