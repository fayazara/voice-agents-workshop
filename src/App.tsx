import { useVoiceAgent } from "@cloudflare/voice/react";
import { useEffect, useRef } from "react";
import type { SVGProps } from "react";

function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M19.95 21q-3.125 0-6.175-1.362t-5.55-3.863t-3.862-5.55T3 4.05q0-.45.3-.75t.75-.3H8.1q.35 0 .625.238t.325.562l.65 3.5q.05.4-.025.675T9.4 8.45L6.975 10.9q.5.925 1.187 1.787t1.513 1.663q.775.775 1.625 1.438T13.1 17l2.35-2.35q.225-.225.588-.337t.712-.063l3.45.7q.35.1.575.363T21 15.9v4.05q0 .45-.3.75t-.75.3"
      />
    </svg>
  );
}

function PhoneHangupIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
      {/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}
      <path
        fill="currentColor"
        d="M4.025 17L.4 13.475l1-1.025q2.175-2.225 4.963-3.337T12 8t5.625 1.113T22.6 12.45l1 1.025L19.975 17L16 14v-3.35q-.95-.3-1.95-.475T12 10t-2.05.175T8 10.65V14z"
      />
    </svg>
  );
}

function App() {
  const {
    status,
    transcript,
    interimTranscript,
    audioLevel,
    isMuted,
    startCall,
    endCall,
    toggleMute,
  } = useVoiceAgent({ agent: "VoiceAgent" });

  const isActive = status !== "idle";

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript.length, interimTranscript]);

  const statusLabel =
    status === "idle"
      ? "Not connected"
      : status === "listening"
        ? "Listening"
        : status === "thinking"
          ? "Thinking"
          : "Speaking";

  return (
    <div className="flex h-screen flex-col bg-neutral-50 text-neutral-900">
      <div className="mx-auto flex h-full w-full max-w-xl flex-col p-6 gap-6">
        {/* Top half - title + call button */}
        <section className="flex flex-col items-center justify-center gap-5 rounded-2xl bg-white p-6">
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Cloudflare Voice Agent
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Tap the phone button to start a call
            </p>
          </div>

          <button
            onClick={isActive ? endCall : startCall}
            aria-label={isActive ? "End call" : "Start call"}
            title={isActive ? "End call" : "Start call"}
            className={`flex size-14 items-center justify-center rounded-full text-3xl text-white shadow-md transition-all cursor-pointer ${
              isActive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isActive ? (
              <PhoneHangupIcon className="size-5" />
            ) : (
              <PhoneIcon className="size-5" />
            )}
          </button>

          {isActive && (
            <div className="grid w-full grid-cols-3 items-center gap-4 pt-2">
              {/* Status badge */}
              <div className="flex w-fit items-center gap-2 justify-self-start rounded-full bg-neutral-100/80 px-3 py-1.5 text-xs font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200/70">
                <span className="relative flex size-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${
                      status === "listening"
                        ? "bg-green-500"
                        : status === "thinking"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                    }`}
                  />
                  <span
                    className={`relative inline-flex size-2 rounded-full ${
                      status === "listening"
                        ? "bg-green-500"
                        : status === "thinking"
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                    }`}
                  />
                </span>
                {statusLabel}
              </div>

              {/* Audio level */}
              <div className="flex h-6 items-end justify-self-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const active = audioLevel > ((i + 1) / 5) * 0.5;
                  return (
                    <div
                      key={i}
                      className="w-1.5 rounded-full transition-all duration-150"
                      style={{
                        height: active
                          ? `${Math.max(6, audioLevel * 24)}px`
                          : "6px",
                        backgroundColor: active
                          ? "rgb(34 197 94)"
                          : "rgb(212 212 212)",
                      }}
                    />
                  );
                })}
              </div>

              {/* Mute button */}
              <button
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
                className="flex h-8 w-8 items-center justify-center justify-self-end rounded-full bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-200/70 transition-colors hover:bg-neutral-200"
              >
                <img
                  src={isMuted ? "https://api.iconify.design/lucide:mic-off.svg" : "https://api.iconify.design/lucide:mic.svg"}
                  alt=""
                  className="h-4 w-4"
                />
              </button>
            </div>
          )}
        </section>

        {/* Bottom half - transcript */}
        <section className="flex flex-1 min-h-0 flex-col overflow-hidden pb-6">
          <div
            className="flex-1 space-y-3 overflow-y-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ msOverflowStyle: "none" }}
          >
            {transcript.length === 0 && !interimTranscript && (
              <p className="pt-6 text-center text-sm text-neutral-400">
                Your conversation will appear here.
              </p>
            )}

            {transcript.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <span
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-orange-500 text-white"
                      : "bg-neutral-200 text-neutral-800"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}

            {interimTranscript && (
              <div className="flex justify-end">
                <span className="max-w-[85%] rounded-2xl bg-orange-500/60 px-4 py-2 text-sm italic text-white">
                  {interimTranscript}
                </span>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
