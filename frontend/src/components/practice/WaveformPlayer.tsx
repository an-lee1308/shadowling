"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

interface Props {
  audioUrl: string;
  onTimeUpdate?: (time: number) => void;
  height?: number;
}

export default function WaveformPlayer({ audioUrl, onTimeUpdate, height = 64 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<import("wavesurfer.js").default | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let ws: import("wavesurfer.js").default;

    async function init() {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      if (!containerRef.current) return;

      ws = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "#c7d2fe",
        progressColor: "#6366f1",
        cursorColor: "#4338ca",
        height,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
      });

      ws.load(audioUrl);
      wsRef.current = ws;

      ws.on("ready", () => {
        setReady(true);
        setDuration(ws.getDuration());
      });

      ws.on("audioprocess", (t: number) => {
        setCurrentTime(t);
        onTimeUpdate?.(t);
      });

      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => setPlaying(false));
    }

    init();

    return () => {
      ws?.destroy();
      wsRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  function togglePlay() {
    wsRef.current?.playPause();
  }

  function rewind() {
    const ws = wsRef.current;
    if (!ws) return;
    ws.setTime(Math.max(0, ws.getCurrentTime() - 5));
  }

  function changeSpeed(s: number) {
    wsRef.current?.setPlaybackRate(s);
    setSpeed(s);
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      {/* Waveform */}
      <div ref={containerRef} className="mb-2" />

      {!ready && (
        <div className="h-16 flex items-center justify-center text-sm text-gray-400">
          Đang tải audio...
        </div>
      )}

      {/* Time */}
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span>{fmt(currentTime)}</span>
        <span>{fmt(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={rewind}
            disabled={!ready}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg disabled:opacity-50 transition"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={togglePlay}
            disabled={!ready}
            className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full flex items-center justify-center transition"
          >
            {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
        </div>

        <div className="flex items-center gap-1">
          {[0.5, 0.75, 1].map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition ${
                speed === s
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
