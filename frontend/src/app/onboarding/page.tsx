"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/api";
import { CheckCircle2, XCircle } from "lucide-react";

const LEVELS = [
  { value: "BEGINNER", label: "Mới bắt đầu", desc: "Tôi mới học tiếng Anh" },
  { value: "INTERMEDIATE", label: "Trung cấp", desc: "Tôi đã biết cơ bản" },
  { value: "ADVANCED", label: "Nâng cao", desc: "Tôi muốn hoàn thiện kỹ năng" },
];

const GOALS = [
  { value: "GENERAL", label: "Giao tiếp hàng ngày", emoji: "💬" },
  { value: "IELTS", label: "Luyện IELTS", emoji: "📝" },
  { value: "TOEIC", label: "Luyện TOEIC", emoji: "📊" },
  { value: "BUSINESS", label: "Tiếng Anh thương mại", emoji: "💼" },
];

const PLACEMENT_QUESTIONS = [
  {
    q: 'She ______ to work by bus every day.',
    options: ["go", "goes", "going", "gone"],
    answer: 1,
  },
  {
    q: 'They ______ in this company for 5 years.',
    options: ["work", "worked", "have worked", "are working"],
    answer: 2,
  },
  {
    q: 'If he had studied harder, he ______ the exam.',
    options: ["passes", "will pass", "would pass", "would have passed"],
    answer: 3,
  },
  {
    q: 'No sooner ______ than it started raining.',
    options: ["we left", "had we left", "we had left", "did we leave"],
    answer: 1,
  },
];

const STEPS = ["Chào mừng", "Kiểm tra", "Mục tiêu", "Hoàn tất"];

function detectLevel(correct: number): string {
  if (correct >= 4) return "ADVANCED";
  if (correct >= 2) return "INTERMEDIATE";
  return "BEGINNER";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("BEGINNER");
  const [goal, setGoal] = useState("GENERAL");
  const [saving, setSaving] = useState(false);

  // Placement test state
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [testDone, setTestDone] = useState(false);
  const [skipTest, setSkipTest] = useState(false);

  function handleAnswer(optIdx: number) {
    if (selected !== null) return;
    const correct = optIdx === PLACEMENT_QUESTIONS[qIdx].answer;
    setSelected(optIdx);
    setTimeout(() => {
      const newAnswers = [...answers, correct];
      setAnswers(newAnswers);
      if (qIdx + 1 < PLACEMENT_QUESTIONS.length) {
        setQIdx(qIdx + 1);
        setSelected(null);
      } else {
        const correctCount = newAnswers.filter(Boolean).length;
        setLevel(detectLevel(correctCount));
        setTestDone(true);
      }
    }, 700);
  }

  async function finish() {
    setSaving(true);
    try {
      const updated = await auth.updateProfile({ level, goal });
      setAuth(updated, updated.token);
      localStorage.setItem("onboarding_done", "1");
      router.push("/dashboard");
    } catch {
      router.push("/dashboard");
    }
  }

  const correctCount = answers.filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Step dots */}
        <div className="flex justify-center gap-2 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary-600" : i < step ? "w-2 bg-primary-400" : "w-2 bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
          >
            {/* Step 0: Welcome */}
            {step === 0 && (
              <div className="text-center">
                <div className="text-5xl mb-4">🦜</div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Chào mừng đến Shadowling!
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  Học tiếng Anh hiệu quả qua Dictation và Shadowing. Chúng tôi sẽ kiểm tra nhanh để xác định trình độ phù hợp nhất với bạn.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
                >
                  Bắt đầu →
                </button>
              </div>
            )}

            {/* Step 1: Placement test */}
            {step === 1 && !testDone && !skipTest && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  Kiểm tra trình độ
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                  Câu {qIdx + 1} / {PLACEMENT_QUESTIONS.length}
                </p>

                {/* Progress bar */}
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
                  <div
                    className="h-1.5 bg-primary-500 rounded-full transition-all"
                    style={{ width: `${(qIdx / PLACEMENT_QUESTIONS.length) * 100}%` }}
                  />
                </div>

                <p className="text-base font-medium text-gray-900 dark:text-gray-100 mb-5">
                  {PLACEMENT_QUESTIONS[qIdx].q}
                </p>

                <div className="space-y-2">
                  {PLACEMENT_QUESTIONS[qIdx].options.map((opt, i) => {
                    const isCorrect = i === PLACEMENT_QUESTIONS[qIdx].answer;
                    const isSelected = selected === i;
                    let cls = "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition";
                    if (selected === null) {
                      cls += " border-gray-200 dark:border-gray-600 hover:border-primary-400 text-gray-800 dark:text-gray-200";
                    } else if (isCorrect) {
                      cls += " border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300";
                    } else if (isSelected) {
                      cls += " border-red-400 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300";
                    } else {
                      cls += " border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500";
                    }
                    return (
                      <button key={i} className={cls} onClick={() => handleAnswer(i)}>
                        <span className="text-gray-400 dark:text-gray-500 mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                        {selected !== null && isCorrect && <CheckCircle2 className="inline ml-2 text-green-500" size={16} />}
                        {selected !== null && isSelected && !isCorrect && <XCircle className="inline ml-2 text-red-500" size={16} />}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setSkipTest(true)}
                  className="mt-5 w-full text-center text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition"
                >
                  Bỏ qua, tự chọn trình độ →
                </button>
              </div>
            )}

            {/* Step 1: Test result */}
            {step === 1 && (testDone || skipTest) && (
              <div>
                {testDone ? (
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-3">
                      {correctCount >= 4 ? "🏆" : correctCount >= 2 ? "💪" : "📚"}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Kết quả: {correctCount}/{PLACEMENT_QUESTIONS.length} đúng
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Trình độ được xác định: <strong className="text-primary-600 dark:text-primary-400">
                        {LEVELS.find(l => l.value === level)?.label}
                      </strong>
                    </p>
                  </div>
                ) : (
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chọn trình độ</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hãy chọn trình độ phù hợp với bạn nhất.</p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {LEVELS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLevel(l.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition ${
                        level === l.value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <p className={`font-semibold ${level === l.value ? "text-primary-700 dark:text-primary-400" : "text-gray-900 dark:text-gray-100"}`}>
                        {l.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{l.desc}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
                >
                  Tiếp theo →
                </button>
              </div>
            )}

            {/* Step 2: Goal */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mục tiêu học tập?</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                  Giúp chúng tôi tùy chỉnh nội dung cho bạn.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  {GOALS.map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setGoal(g.value)}
                      className={`p-4 rounded-xl border-2 text-center transition ${
                        goal === g.value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                          : "border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="text-2xl mb-1">{g.emoji}</div>
                      <p className={`text-sm font-medium ${goal === g.value ? "text-primary-700 dark:text-primary-400" : "text-gray-700 dark:text-gray-300"}`}>
                        {g.label}
                      </p>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
                >
                  Tiếp theo →
                </button>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tất cả đã sẵn sàng!</h2>
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-8">
                  <p>Trình độ: <strong className="text-gray-900 dark:text-gray-100">{LEVELS.find((l) => l.value === level)?.label}</strong></p>
                  <p>Mục tiêu: <strong className="text-gray-900 dark:text-gray-100">{GOALS.find((g) => g.value === goal)?.label}</strong></p>
                </div>
                <button
                  onClick={finish}
                  disabled={saving}
                  className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 disabled:opacity-50 transition"
                >
                  {saving ? "Đang lưu..." : "Bắt đầu học ngay! 🚀"}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step > 0 && !(step === 1 && !testDone && !skipTest) && (
          <button
            onClick={() => {
              if (step === 1) { setTestDone(false); setSkipTest(false); setQIdx(0); setSelected(null); setAnswers([]); }
              setStep((s) => s - 1);
            }}
            className="mt-4 w-full text-center text-sm text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition"
          >
            ← Quay lại
          </button>
        )}
      </div>
    </div>
  );
}
