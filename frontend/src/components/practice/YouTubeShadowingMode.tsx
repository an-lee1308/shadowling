"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Play, RotateCcw, ChevronRight, CheckCircle2,
  Volume2, Eye, EyeOff, ChevronLeft,
} from "lucide-react";
import type { YouTubeLesson, YouTubeCaptionSegment, YouTubeSentenceProgressItem } from "@/types";
import { youtube } from "@/lib/api";

// Minimal YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady: () => void;
  }
}
interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
}

interface PronunciationResult {
  transcript: string;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  wordScores: { word: string; recognized: string; correct: boolean; score: number }[];
}

type SegmentState = "idle" | "listening" | "recording" | "scoring" | "done";

interface Props {
  lesson: YouTubeLesson;
}

export default function YouTubeShadowingMode({ lesson }: Props) {
  const segments: YouTubeCaptionSegment[] = lesson.captions;

  // Build initial progress map from lesson data
  const initProgress = (): Map<number, YouTubeSentenceProgressItem> => {
    const m = new Map<number, YouTubeSentenceProgressItem>();
    lesson.sentenceProgress.forEach((p) => m.set(p.sentenceIndex, p));
    return m;
  };

  const [currentIdx, setCurrentIdx] = useState(0);
  const [segState, setSegState] = useState<SegmentState>("idle");
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [progressMap, setProgressMap] = useState<Map<number, YouTubeSentenceProgressItem>>(initProgress);
  const [showTranscript, setShowTranscript] = useState(true);
  const [micError, setMicError] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [playerReady, setPlayerReady] = useState(false);
  const [finished, setFinished] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const playerDivRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const loopIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const vizCanvasRef = useRef<HTMLCanvasElement>(null);

  const currentSeg = segments[currentIdx];

  // Load YouTube IFrame API
  useEffect(() => {
    const initPlayer = () => {
      if (!playerDivRef.current) return;
      playerRef.current = new window.YT.Player(playerDivRef.current, {
        videoId: lesson.youtubeVideoId,
        playerVars: { rel: 0, modestbranding: 1, enablejsapi: 1 },
        events: {
          onReady: () => setPlayerReady(true),
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    }

    return () => {
      if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [lesson.youtubeVideoId]);

  const drawBars = useCallback(() => {
    const canvas = vizCanvasRef.current;
    if (!canvas || !analyserRef.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barW = canvas.width / data.length;
    data.forEach((v, i) => {
      ctx.fillStyle = "#6366f1";
      const h = (v / 255) * canvas.height;
      ctx.fillRect(i * barW, canvas.height - h, Math.max(1, barW - 1), h);
    });
    animFrameRef.current = requestAnimationFrame(drawBars);
  }, []);

  function playSample() {
    if (!playerRef.current || !playerReady) return;
    const seg = segments[currentIdx];
    setSegState("listening");

    playerRef.current.seekTo(seg.startMs / 1000, true);
    playerRef.current.playVideo();

    if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
    loopIntervalRef.current = setInterval(() => {
      if (!playerRef.current) return;
      const current = playerRef.current.getCurrentTime();
      if (current >= seg.endMs / 1000) {
        playerRef.current.pauseVideo();
        clearInterval(loopIntervalRef.current!);
        loopIntervalRef.current = null;
        setSegState("idle");
      }
    }, 100);
  }

  async function startRecording() {
    setMicError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordingUrl(URL.createObjectURL(blob));
        uploadAndScore(blob);
      };

      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawBars();
      } catch { /* visualizer non-critical */ }

      recorder.start(250);
      setSegState("recording");
    } catch {
      setMicError("Không thể truy cập microphone. Hãy cấp quyền và thử lại.");
    }
  }

  function stopRecording() {
    cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    mediaRecorderRef.current?.stop();
    setSegState("scoring");
  }

  async function uploadAndScore(blob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      formData.append("referenceText", currentSeg.text);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/speech/score`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        }
      );
      const json = await res.json();
      if (json.success) {
        const scored = json.data as PronunciationResult;
        setResult(scored);

        // Save progress to backend
        try {
          const saved = await youtube.updateProgress(lesson.id, currentIdx, scored.overallScore);
          setProgressMap((prev) => new Map(prev).set(currentIdx, saved));
        } catch { /* progress save failure is non-critical */ }
      }
    } catch (e) {
      console.error("Score failed:", e);
    } finally {
      setSegState("done");
    }
  }

  function goNext() {
    if (recordingUrl) { URL.revokeObjectURL(recordingUrl); setRecordingUrl(""); }
    setResult(null);
    if (currentIdx < segments.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSegState("idle");
    } else {
      setFinished(true);
    }
  }

  function restart() {
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
    setRecordingUrl("");
    setResult(null);
    setFinished(false);
    setCurrentIdx(0);
    setSegState("idle");
  }

  const scoreColor = (s: number) => s >= 80 ? "text-green-600" : s >= 50 ? "text-yellow-600" : "text-red-600";
  const completedCount = Array.from(progressMap.values()).filter((p) => p.completed).length;

  if (finished) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hoàn thành!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {completedCount}/{segments.length} câu đã pass (≥70 điểm)
        </p>
        <button
          onClick={restart}
          className="flex items-center gap-2 mx-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <RotateCcw size={16} />
          Làm lại từ đầu
        </button>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: player + controls */}
      <div className="lg:col-span-2 space-y-4">
        {/* YouTube embed */}
        <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
          <div ref={playerDivRef} className="absolute inset-0" />
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Câu {currentIdx + 1} / {segments.length}</span>
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
          >
            {showTranscript ? <EyeOff size={14} /> : <Eye size={14} />}
            {showTranscript ? "Ẩn transcript" : "Hiện transcript"}
          </button>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
          <div
            className="h-1.5 bg-primary-500 rounded-full transition-all"
            style={{ width: `${(currentIdx / segments.length) * 100}%` }}
          />
        </div>

        {/* Current sentence */}
        <AnimatePresence mode="wait">
          {showTranscript && (
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700"
            >
              <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Nói nhại theo:</p>
              <p className="text-lg text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{currentSeg.text}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="flex flex-col items-center gap-5">
          <button
            onClick={playSample}
            disabled={!playerReady || segState === "recording" || segState === "scoring"}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            <Volume2 size={18} />
            {segState === "listening" ? "Đang phát..." : "Nghe mẫu"}
          </button>

          <div className="flex flex-col items-center gap-3">
            {segState === "recording" ? (
              <button
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition"
              >
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                />
                <MicOff size={28} className="relative z-10" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={segState === "listening" || segState === "scoring" || segState === "done"}
                className="w-20 h-20 rounded-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white flex items-center justify-center shadow-lg transition"
              >
                <Mic size={28} />
              </button>
            )}

            {segState === "recording" && (
              <canvas ref={vizCanvasRef} width={200} height={40} className="rounded-lg bg-gray-100 dark:bg-gray-800" />
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {segState === "idle" && "Nhấn để ghi âm"}
              {segState === "recording" && "Đang ghi âm... nhấn để dừng"}
              {segState === "scoring" && "Đang phân tích phát âm..."}
              {segState === "done" && "Xong!"}
            </p>
          </div>

          {micError && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{micError}</p>}
        </div>

        {/* Result */}
        <AnimatePresence>
          {segState === "done" && result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                {[
                  { label: "Tổng thể", value: result.overallScore },
                  { label: "Chính xác", value: result.accuracyScore },
                  { label: "Lưu loát", value: result.fluencyScore },
                ].map((s) => (
                  <div key={s.label} className="p-4 text-center">
                    <p className={`text-2xl font-bold ${scoreColor(s.value)}`}>{s.value.toFixed(0)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {result.wordScores.map((w, i) => (
                    <span
                      key={i}
                      className={`px-2 py-1 rounded-lg text-sm font-medium border ${
                        w.correct
                          ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                      }`}
                      title={w.correct ? "" : `Nghe được: "${w.recognized || "—"}"`}
                    >
                      {w.word}
                    </span>
                  ))}
                </div>
                {result.transcript && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-400">AI nghe được:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-0.5">"{result.transcript}"</p>
                  </div>
                )}
                {recordingUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => new Audio(recordingUrl).play()}
                      className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      <Play size={12} />
                      Nghe lại giọng của bạn
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (currentIdx > 0) {
                setCurrentIdx((i) => i - 1);
                setSegState("idle");
                setResult(null);
                if (recordingUrl) { URL.revokeObjectURL(recordingUrl); setRecordingUrl(""); }
              }
            }}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition text-sm"
          >
            <ChevronLeft size={15} /> Câu trước
          </button>
          {segState === "done" && (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition text-sm"
            >
              {currentIdx < segments.length - 1 ? <>Câu tiếp <ChevronRight size={15} /></> : "Hoàn thành ✓"}
            </button>
          )}
        </div>
      </div>

      {/* Right: sentence list */}
      <div className="lg:col-span-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Danh sách câu ({completedCount}/{segments.length} pass)
        </p>
        <div className="space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
          {segments.map((seg, i) => {
            const prog = progressMap.get(i);
            const isActive = i === currentIdx;
            return (
              <button
                key={i}
                onClick={() => {
                  setCurrentIdx(i);
                  setSegState("idle");
                  setResult(null);
                  if (recordingUrl) { URL.revokeObjectURL(recordingUrl); setRecordingUrl(""); }
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition border ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-800 dark:text-primary-300"
                    : prog?.completed
                    ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold opacity-50 shrink-0">#{i + 1}</span>
                  {prog?.completed && <span className="text-xs text-green-600 dark:text-green-400 shrink-0">{prog.bestScore}</span>}
                </div>
                <p className="mt-0.5 line-clamp-2 leading-snug">{seg.text}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
