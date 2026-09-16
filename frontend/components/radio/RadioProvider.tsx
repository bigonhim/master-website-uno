"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { RadioStatusPayload } from "@/lib/api/types";

type PlayerState = "idle" | "connecting" | "playing" | "stopped" | "error";

interface RadioContextValue {
  player: PlayerState;
  station: RadioStatusPayload;
  isLive: boolean;
  volume: number;
  muted: boolean;
  canControlVolume: boolean;
  play: () => Promise<void>;
  stop: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

const RadioContext = createContext<RadioContextValue | null>(null);

export function useRadio(): RadioContextValue {
  const context = useContext(RadioContext);
  if (!context) throw new Error("useRadio must be used inside <RadioProvider>");
  return context;
}

export function RadioProvider({
  initialStatus,
  children,
}: {
  initialStatus: RadioStatusPayload;
  children: ReactNode;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const retries = useRef(0);
  const [station, setStation] = useState(initialStatus);
  const [player, setPlayer] = useState<PlayerState>("idle");
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [canControlVolume, setCanControlVolume] = useState(true);

  const isLive = station.status === "live";

  useEffect(() => {
    // iOS ignores HTMLMediaElement.volume entirely, so hide the slider rather
    // than ship a control that visibly does nothing.
    setCanControlVolume(!/iPad|iPhone|iPod/.test(navigator.userAgent));
    try {
      const saved = localStorage.getItem("radio:prefs");
      if (saved) {
        const prefs = JSON.parse(saved);
        if (typeof prefs.volume === "number") setVolume(prefs.volume);
        setMuted(Boolean(prefs.muted));
      }
    } catch {
      // Private windows and blocked site data both throw here. The player
      // works fine without remembered preferences.
    }
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !station.stream_url) return;
    setPlayer("connecting");
    // src is assigned at play time: no bandwidth before consent, and the
    // cache-buster stops the browser resuming a stale buffered chunk of what
    // is supposed to be a live stream.
    const separator = station.stream_url.includes("?") ? "&" : "?";
    audio.src = `${station.stream_url}${separator}_=${Date.now()}`;
    audio.volume = muted ? 0 : volume;
    try {
      await audio.play();
      retries.current = 0;
      setPlayer("playing");
    } catch {
      setPlayer("error");
    }
  }, [station.stream_url, volume, muted]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // "Pause" is meaningless on a live stream — tear down fully so the next
    // play reconnects at the live edge instead of minutes behind.
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    setPlayer("stopped");
  }, []);

  const toggle = useCallback(() => {
    if (player === "playing") stop();
    else void play();
  }, [player, play, stop]);

  // Status polling: faster while listening so now-playing stays fresh.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    const tick = async () => {
      if (document.visibilityState === "visible") {
        try {
          const response = await fetch("/api/radio/status", {
            signal: controller.signal,
            cache: "no-store",
          });
          if (response.ok) setStation(await response.json());
        } catch {
          // Transient. Keep the last known state; never fabricate "live".
        }
      }
      timer = setTimeout(tick, player === "playing" ? 10_000 : 30_000);
    };

    timer = setTimeout(tick, player === "playing" ? 10_000 : 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        clearTimeout(timer);
        void tick();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [player]);

  // Reconnect with backoff when a live stream drops.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onBreak = () => {
      if (player !== "playing") return;
      if (retries.current >= 5) {
        setPlayer("error");
        return;
      }
      const delay = Math.min(30_000, 1000 * 2 ** retries.current);
      retries.current += 1;
      setPlayer("connecting");
      setTimeout(() => void play(), delay);
    };
    audio.addEventListener("error", onBreak);
    audio.addEventListener("stalled", onBreak);
    audio.addEventListener("ended", onBreak); // a live stream should never end
    return () => {
      audio.removeEventListener("error", onBreak);
      audio.removeEventListener("stalled", onBreak);
      audio.removeEventListener("ended", onBreak);
    };
  }, [player, play]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = muted ? 0 : volume;
    try {
      localStorage.setItem("radio:prefs", JSON.stringify({ volume, muted }));
    } catch {
      /* storage unavailable; preferences simply are not remembered */
    }
  }, [volume, muted]);

  return (
    <RadioContext.Provider
      value={{
        player,
        station,
        isLive,
        volume,
        muted,
        canControlVolume,
        play,
        stop,
        toggle,
        setVolume,
        toggleMute: () => setMuted((m) => !m),
      }}
    >
      {/*
        Rendered unconditionally and never re-keyed. This element is the thing
        that has to survive every navigation, so it must not be wrapped in a
        conditional or keyed on pathname.
      */}
      <audio ref={audioRef} preload="none" playsInline crossOrigin="anonymous" />
      {children}
    </RadioContext.Provider>
  );
}
