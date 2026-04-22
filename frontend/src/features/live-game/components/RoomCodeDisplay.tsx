interface RoomCodeDisplayProps {
  code: string;
  status?: "lobby" | "live";
}

export function RoomCodeDisplay({ code, status = "lobby" }: RoomCodeDisplayProps) {
  // Accept 7-char "XXX-XXX" or raw "XXXXXX" and normalise to "XXX-XXX".
  const formatted = code.includes("-")
    ? code
    : `${code.slice(0, 3)}-${code.slice(3)}`;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Status pill */}
      <span
        className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase"
        style={{ background: "rgba(141,205,255,0.10)", color: "#8DCDFF" }}
      >
        <span className="h-2 w-2 rounded-full bg-current" />
        {status === "live" ? "LIVE" : "LOBBY OPEN"}
      </span>

      <p className="text-sm" style={{ color: "#8B8FB8" }}>
        Join at nebula.live with code:
      </p>

      {/* Giant gradient room code */}
      <div
        className="font-mono font-bold leading-none tracking-tight select-all"
        style={{
          fontSize: "clamp(56px, 10vw, 120px)",
          backgroundImage: "linear-gradient(180deg, #A68CFF 0%, #7C4DFF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {formatted}
      </div>

      <p className="text-sm" style={{ color: "#8B8FB8" }}>
        Waiting for players to connect…
      </p>
    </div>
  );
}
