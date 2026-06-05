"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Play, RotateCcw, ChevronRight, CheckCircle2, Volume2 } from "lucide-react";
import type { Lesson, TranscriptSegment } from "@/types";
import { practice } from "@/lib/api";

interface PronunciationResult {
  transcript: string;
  overallScore: number;
  accuracyScore: number;
  fluencyScore: number;
  correctWords: number;
  totalWords: number;
  wordScores: { word: string; recognized: string; correct: boolean; score: number }[];
}

interface Props {
  lesson: Lesson;
  onComplete: (score: number, accuracy: number) => void;
}

type SegmentState = "idle" | "listening" | "recording" | "scoring" | "done";

export default function ShadowingMode({ lesson, onComplete }: Props) {
  const segments: TranscriptSegment[] = lesson.transcript
    ? JSON.parse(lesson.transcript)
    : [];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [segState, setSegState] = useState<SegmentState>("idle");
  const [results, setResults] = useState<(PronunciationResult | null)[]>(
    Array(segments.length).fill(null)
  );
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const [micError, setMicError] = useState("");
  const [scoreError, setScoreError] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const vizCanvasRef = useRef<HTMLCanvasElement>(null);

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
      const h = (v / 255) * canvas.height;
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(i * barW, canvas.height - h, Math.max(1, barW - 1), h);
    });
    animFrameRef.current = requestAnimationFrame(drawBars);
  }, []);

  const currentSeg = segments[currentIdx];
  const currentResult = results[currentIdx];

  async function playAudio() {
    if (!lesson.audioUrl) return;
    setSegState("listening");
    const audio = new Audio(lesson.audioUrl);
    audioRef.current = audio;

    const seg = currentSeg;
    audio.currentTime = seg.start;
    await audio.play();

    audio.ontimeupdate = () => {
      if (audio.currentTime >= seg.end) {
        audio.pause();
        setSegState("idle");
        audio.ontimeupdate = null;
      }
    };

    audio.onended = () => setSegState("idle");
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

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordingUrl(URL.createObjectURL(blob));
        uploadAndScore(blob);
      };

      // Live visualizer
      try {
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawBars();
      } catch {
        // visualizer is non-critical
      }

      recorder.start(250);
      setSegState("recording");
    } catch {
      setMicError("Không thể truy cập microphone. Hãy cấp quyền và thử lại.");
      setSegState("idle");
    }
  }

  function stopRecording() {
    cancelAnimationFrame(animFrameRef.current);
    analyserRef.current = null;
    mediaRecorderRef.current?.stop();
    setSegState("scoring");
  }

  async function uploadAndScore(blob: Blob) {
    setScoreError("");
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
        const result = json.data as PronunciationResult;
        setResults((prev) => {
          const next = [...prev];
          next[currentIdx] = result;
          return next;
        });
      } else {
        setScoreError("Không thể phân tích phát âm. Hãy thử lại.");
      }
    } catch {
      setScoreError("Lỗi kết nối. Kiểm tra mạng và thử lại.");
    } finally {
      setSegState("done");
    }
  }

  async function goNext() {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl("");
    }
    if (currentIdx < segments.length - 1) {
      setCurrentIdx((i) => i + 1);
      setSegState("idle");
    } else {
      await finishSession();
    }
  }

  async function finishSession() {
    const validResults = results.filter(Boolean) as PronunciationResult[];
    const avg =
      validResults.length > 0
        ? validResults.reduce((s, r) => s + r.overallScore, 0) / validResults.length
        : 0;
    const avgAccuracy =
      validResults.length > 0
        ? validResults.reduce((s, r) => s + r.accuracyScore, 0) / validResults.length
        : 0;

    setFinished(true);
    onComplete(avg, avgAccuracy);
    await practice.saveShadowing({
      lessonId: lesson.id,
      score: avg,
      accuracyPercent: avgAccuracy,
    });
  }

  if (segments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Bài học này chưa có transcript để luyện Shadowing.
      </div>
    );
  }

  if (finished) {
    const validResults = results.filter(Boolean) as PronunciationResult[];
    const avg =
      validResults.length > 0
        ? validResults.reduce((s, r) => s + r.overallScore, 0) / validResults.length
        : 0;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Hoàn thành Shadowing!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Điểm phát âm tổng thể</p>
        <div className="text-5xl font-bold text-primary-600 mb-6">{avg.toFixed(1)}</div>

        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
          {results.filter(Boolean).map((r, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">Câu {i + 1}</div>
              <div className={`text-lg font-bold ${
                (r?.overallScore ?? 0) >= 80 ? "text-green-600" :
                (r?.overallScore ?? 0) >= 50 ? "text-yellow-600" : "text-red-600"
              }`}>{r?.overallScore.toFixed(0)}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            if (recordingUrl) URL.revokeObjectURL(recordingUrl);
            setRecordingUrl("");
            setFinished(false);
            setCurrentIdx(0);
            setSegState("idle");
            setResults(Array(segments.length).fill(null));
          }}
          className="flex items-center gap-2 mx-auto px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <RotateCcw size={16} />
          Làm lại
        </button>
      </motion.div>
    );
  }

  const scoreColor = (score: number) =>
    score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Câu {currentIdx + 1} / {segments.length}</span>
        <span>{results.filter(Boolean).length} câu đã hoàn thành</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
        <div
          className="h-1.5 bg-primary-500 rounded-full transition-all"
          style={{ width: `${((currentIdx) / segments.length) * 100}%` }}
        />
      </div>

      {/* Current sentence */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-400 mb-2 font-medium uppercase tracking-wide">Nói nhại theo:</p>
        <p className="text-xl text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{currentSeg.text}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        {/* Listen button */}
        {lesson.audioUrl && (
          <button
            onClick={playAudio}
            disabled={segState === "recording" || segState === "scoring"}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            <Volume2 size={18} />
            {segState === "listening" ? "Đang phát..." : "Nghe mẫu"}
          </button>
        )}

        {/* Record button */}
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
            <canvas
              ref={vizCanvasRef}
              width={200}
              height={40}
              className="rounded-lg bg-gray-100 dark:bg-gray-800"
            />
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {segState === "idle" && "Nhấn để ghi âm"}
            {segState === "recording" && "Đang ghi âm... nhấn để dừng"}
            {segState === "scoring" && "Đang phân tích phát âm..."}
            {segState === "done" && "Hoàn thành!"}
          </p>
        </div>

        {micError && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{micError}</p>
        )}
        {scoreError && (
          <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg">{scoreError}</p>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {segState === "done" && currentResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Scores */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-700 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              {[
                { label: "Tổng thể", value: currentResult.overallScore },
                { label: "Độ chính xác", value: currentResult.accuracyScore },
                { label: "Sự lưu loát", value: currentResult.fluencyScore },
              ].map((s) => (
                <div key={s.label} className="p-4 text-center">
                  <p className={`text-2xl font-bold ${scoreColor(s.value)}`}>
                    {s.value.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Word-by-word */}
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium">Phân tích từng từ:</p>
              <div className="flex flex-wrap gap-2">
                {currentResult.wordScores.map((w, i) => (
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

              {currentResult.transcript && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-400">AI nghe được:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-0.5">"{currentResult.transcript}"</p>
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

      {/* Next button */}
      {segState === "done" && (
        <button
          onClick={goNext}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
        >
          {currentIdx < segments.length - 1 ? (
            <>Câu tiếp theo <ChevronRight size={16} /></>
          ) : (
            "Hoàn thành bài học ✓"
          )}
        </button>
      )}

      {/* Segment dots */}
      <div className="flex gap-1.5 flex-wrap">
        {segments.map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition ${
              i === currentIdx
                ? "bg-primary-600 text-white"
                : results[i]
                ? (results[i]?.overallScore ?? 0) >= 80
                  ? "bg-green-200 text-green-700"
                  : "bg-yellow-200 text-yellow-700"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}
