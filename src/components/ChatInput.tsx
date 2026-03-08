import { useState } from "react";
import { Send } from "lucide-react";

const QUICK_PICKS = ["🔥", "💀", "😂", "LFG!", "No way!", "What a shot!"];

interface ChatInputProps {
  onSend: (text: string) => void;
}

const ChatInput = ({ onSend }: ChatInputProps) => {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <div className="ios-glass px-3 py-2" style={{ borderTop: "0.5px solid hsl(0 0% 0% / 0.1)" }}>
      {/* Quick picks */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick}
            onClick={() => onSend(pick)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full bg-secondary text-foreground text-xs font-medium hover:bg-muted active:scale-95 transition-all duration-150"
          >
            {pick}
          </button>
        ))}
      </div>
      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Drop your take..."
          className="flex-1 px-4 py-2 rounded-full bg-secondary text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200"
        />
        <button
          onClick={handleSend}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-90 transition-transform duration-150"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
