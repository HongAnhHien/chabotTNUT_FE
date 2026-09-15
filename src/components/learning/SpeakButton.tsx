import { type FC, useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";

/** Bỏ cú pháp markdown/LaTeX để đọc trơn tru bằng giọng nói. */
export function stripForSpeech(md: string): string {
  return (md ?? "")
    .replace(/```[\s\S]*?```/g, " ")        // khối code
    .replace(/`[^`]*`/g, " ")               // code inline
    .replace(/\$\$[\s\S]*?\$\$/g, " biểu thức ") // LaTeX display
    .replace(/\$[^$\n]+?\$/g, " biểu thức ")     // LaTeX inline
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")  // ảnh
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // link → giữ chữ
    .replace(/[#>*_~|]/g, " ")              // ký hiệu md
    .replace(/\s+/g, " ")
    .trim();
}

const SpeakButton: FC<{ text: string; size?: number }> = ({ text, size = 12 }) => {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  if (!supported) return null;

  const pickVietVoice = (): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find((v) => v.lang?.toLowerCase().startsWith("vi")) ??
      voices.find((v) => /vietnam/i.test(v.name)) ??
      null
    );
  };

  const toggle = () => {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const content = stripForSpeech(text);
    if (!content) return;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(content);
    utt.lang = "vi-VN";
    const v = pickVietVoice();
    if (v) utt.voice = v;
    utt.rate = 1;
    utt.pitch = 1;
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    uttRef.current = utt;
    setSpeaking(true);
    synth.speak(utt);
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "Dừng đọc" : "Nghe đọc lời giải"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        padding: "3px 5px", borderRadius: 5,
        color: speaking ? "#2563eb" : "#94a3b8",
        display: "flex", alignItems: "center", gap: 3,
      }}
    >
      {speaking ? <Square size={size} /> : <Volume2 size={size} />}
    </button>
  );
};

export default SpeakButton;
