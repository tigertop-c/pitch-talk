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
    <div className="border-t-[3px] border-foreground bg-card px-3 py-2">
      {/* Quick picks */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
        {QUICK_PICKS.map((pick) => (
          <button
            key={pick}
            onClick={() => onSend(pick)}
            className="flex-shrink-0 px-2.5 py-1 rounded-md border-2 border-foreground bg-muted text-foreground text-xs font-mono font-bold hover:bg-neon hover:text-neon-foreground active:scale-95 transition-all"
            style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
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
          className="flex-1 px-3 py-2 rounded-md border-2 border-foreground bg-muted text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-neon"
          style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
        />
        <button
          onClick={handleSend}
          className="px-3 py-2 rounded-md border-2 border-foreground bg-neon text-neon-foreground font-bold active:scale-95 transition-all"
          style={{ boxShadow: "2px 2px 0px hsl(0 0% 0%)" }}
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
