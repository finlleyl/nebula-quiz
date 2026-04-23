interface RoomCodeDisplayProps {
  code: string;
  status?: "lobby" | "live";
}

export function RoomCodeDisplay({ code, status = "lobby" }: RoomCodeDisplayProps) {
  const formatted = code.includes("-")
    ? code
    : `${code.slice(0, 3)}-${code.slice(3)}`;

  return (
    <div className="flex flex-col items-start gap-2.5">
      <span className="text-[15px] text-text-secondary">
        Заходите на <b className="text-text-primary">квиз.лайв</b> и введите код
      </span>
      <div
        className="select-all font-mono font-extrabold leading-none tracking-[-0.02em]"
        style={{
          fontSize: "clamp(56px, 10vw, 128px)",
          backgroundImage:
            "linear-gradient(180deg, #0D1A2B 0%, #0077FF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {formatted}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm text-text-secondary">
        <span
          className="inline-block size-2 rounded-full bg-success"
          style={{ animation: "pulse 1.6s ease-in-out infinite" }}
        />
        {status === "live"
          ? "В эфире"
          : "Ожидаем подключения участников…"}
      </div>
    </div>
  );
}
