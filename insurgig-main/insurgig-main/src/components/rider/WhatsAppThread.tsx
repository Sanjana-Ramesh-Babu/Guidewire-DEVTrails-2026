import { ArrowLeft, Phone, Video, MoreVertical, Shield } from "lucide-react";

export interface ChatMessage {
  from: "bot" | "user";
  text: string;
  button?: { label: string; action?: string } | null;
}

interface Props {
  messages: ChatMessage[];
  onAction?: (action: string) => void;
  title?: string;
  subtitle?: string;
}

const WhatsAppThread = ({ messages, onAction, title = "InsurGig", subtitle = "online" }: Props) => (
  <div className="w-full max-w-[390px] mx-auto rounded-3xl overflow-hidden border-4 border-foreground/10 shadow-lg bg-card">
    <div className="bg-[hsl(152,60%,28%)] px-3 py-2.5 flex items-center gap-3 text-[hsl(0,0%,100%)]">
      <ArrowLeft size={18} className="opacity-90" />
      <div className="w-8 h-8 rounded-full bg-[hsl(0,0%,100%)]/20 flex items-center justify-center">
        <Shield size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{title}</p>
        <p className="text-[10px] opacity-75">{subtitle}</p>
      </div>
      <Video size={18} className="opacity-90" />
      <Phone size={18} className="opacity-90" />
      <MoreVertical size={18} className="opacity-90" />
    </div>
    <div className="bg-[hsl(30,25%,92%)] px-3 py-4 space-y-2 min-h-[320px] max-h-[480px] overflow-y-auto">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-line ${
              msg.from === "user"
                ? "bg-[hsl(120,35%,80%)] text-[hsl(0,0%,10%)]"
                : "bg-[hsl(0,0%,100%)] text-[hsl(0,0%,10%)]"
            }`}
          >
            {msg.text}
            {msg.button && (
              <div className="mt-2 pt-2 border-t border-[hsl(0,0%,85%)]">
                <button
                  type="button"
                  onClick={() => msg.button?.action && onAction?.(msg.button.action)}
                  className="w-full bg-[hsl(152,60%,28%)] text-[hsl(0,0%,100%)] text-center py-2 rounded font-medium text-[11px]"
                >
                  {msg.button.label}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default WhatsAppThread;
