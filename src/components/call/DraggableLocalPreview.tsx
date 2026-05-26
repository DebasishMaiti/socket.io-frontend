import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";

const PREVIEW_WIDTH = 160;
const PREVIEW_HEIGHT = 120;
const MARGIN = 16;

type DraggableLocalPreviewProps = {
  boundsRef: RefObject<HTMLElement | null>;
  showVideo: boolean;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  displayName: string;
  hasLocalStream: boolean;
};

export default function DraggableLocalPreview({
  boundsRef,
  showVideo,
  localVideoRef,
  displayName,
  hasLocalStream,
}: DraggableLocalPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const pointerOffset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const clampPosition = useCallback((x: number, y: number) => {
    const bounds = boundsRef.current?.getBoundingClientRect();
    if (!bounds) return { x, y };

    const maxX = Math.max(MARGIN, bounds.width - PREVIEW_WIDTH - MARGIN);
    const maxY = Math.max(MARGIN, bounds.height - PREVIEW_HEIGHT - MARGIN);

    return {
      x: Math.min(Math.max(MARGIN, x), maxX),
      y: Math.min(Math.max(MARGIN, y), maxY),
    };
  }, [boundsRef]);

  const defaultPosition = useCallback(() => {
    const bounds = boundsRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return clampPosition(
      bounds.width - PREVIEW_WIDTH - MARGIN,
      bounds.height - PREVIEW_HEIGHT - MARGIN
    );
  }, [boundsRef, clampPosition]);

  useEffect(() => {
    if (position !== null) return;
    const initial = defaultPosition();
    if (initial) setPosition(initial);
  }, [position, defaultPosition]);

  useEffect(() => {
    const bounds = boundsRef.current;
    if (!bounds) return;

    const observer = new ResizeObserver(() => {
      setPosition((prev) => {
        const base = prev ?? defaultPosition();
        if (!base) return prev;
        return clampPosition(base.x, base.y);
      });
    });

    observer.observe(bounds);
    return () => observer.disconnect();
  }, [boundsRef, clampPosition, defaultPosition]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!previewRef.current || !boundsRef.current) return;
    e.preventDefault();
    previewRef.current.setPointerCapture(e.pointerId);
    setIsDragging(true);

    const bounds = boundsRef.current.getBoundingClientRect();
    const elRect = previewRef.current.getBoundingClientRect();
    pointerOffset.current = {
      x: e.clientX - elRect.left,
      y: e.clientY - elRect.top,
    };

    setPosition((prev) =>
      prev ??
      clampPosition(elRect.left - bounds.left, elRect.top - bounds.top)
    );
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !boundsRef.current) return;

    const bounds = boundsRef.current.getBoundingClientRect();
    const x = e.clientX - bounds.left - pointerOffset.current.x;
    const y = e.clientY - bounds.top - pointerOffset.current.y;
    setPosition(clampPosition(x, y));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    previewRef.current?.releasePointerCapture(e.pointerId);
    setIsDragging(false);
  };

  const coords = position ?? defaultPosition();

  return (
    <div
      ref={previewRef}
      className={cn(
        "absolute z-30 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-[#1a1a1a]",
        "touch-none select-none",
        isDragging ? "cursor-grabbing ring-2 ring-blue-500/50" : "cursor-grab"
      )}
      style={{
        left: coords?.x ?? undefined,
        top: coords?.y ?? undefined,
        right: coords ? undefined : MARGIN,
        bottom: coords ? undefined : MARGIN,
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {showVideo ? (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror pointer-events-none"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#252525] gap-1 pointer-events-none">
          <span className="text-lg font-bold text-white">
            {displayName?.charAt(0).toUpperCase() || "You"}
          </span>
          {hasLocalStream && (
            <span className="text-[10px] text-gray-400">Audio only</span>
          )}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 pointer-events-none">
        <p className="text-white text-[10px] truncate">{displayName || "You"} (You)</p>
      </div>
    </div>
  );
}
