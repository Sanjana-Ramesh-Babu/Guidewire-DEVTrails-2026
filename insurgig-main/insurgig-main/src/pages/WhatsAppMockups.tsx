import { useState } from "react";
import { ArrowLeft, Phone, Video, MoreVertical, Shield } from "lucide-react";

interface Message {
  from: "bot" | "user";
  text: string;
  hasButton?: string;
}

const screen1: Message[] = [
  { from: "bot", text: "Namaste! Welcome to InsurGig — income protection for delivery riders. Reply in your preferred language:\n1. Hindi  2. English  3. Tamil  4. Telugu  5. Kannada" },
  { from: "user", text: "2" },
  { from: "bot", text: "Great! Let's get you covered in 2 minutes.\nWhat's your name?" },
  { from: "user", text: "Rajan Kumar" },
  { from: "bot", text: "Hi Rajan! Which city do you work in?" },
  { from: "user", text: "Bengaluru" },
  { from: "bot", text: "Which platform do you deliver for?\n1. Swiggy  2. Zomato  3. Both" },
  { from: "user", text: "2" },
  { from: "bot", text: "How many hours per week do you typically work?" },
  { from: "user", text: "50 hours" },
  { from: "bot", text: "What were your approximate earnings last month? (Just a rough number is fine)" },
  { from: "user", text: "22000" },
  { from: "bot", text: "Perfect Rajan! Based on your profile, you qualify for our Full-time Rider plan.\n\nCoverage: Up to ₹1,800/week\nWeekly premium: ₹129 (auto-debited every Friday)\n\nTap below to set up your coverage:", hasButton: "Set Up Coverage →" },
];

const screen2: Message[] = [
  { from: "bot", text: "Good morning Rajan!\n\nYour InsurGig coverage is active for this week.\n\nTier: Full-time Rider\nPremium: ₹129 (deducted Friday)\nCoverage cap: ₹1,800\n\nThis week's risk forecast:\n🌧 Wed — Heavy rain likely (Armed)\n🗳 Fri — Election dry day (Armed)\n\nStay safe and ride well! 🛵" },
];

const screen3: Message[] = [
  { from: "bot", text: "Your claim is being processed.\n\nTrigger: Heavy rain — Koramangala\nExpected payout: ₹1,120\n\nTo get paid faster, tap below to confirm your current location (takes 10 seconds):", hasButton: "Confirm Location →" },
  { from: "bot", text: "Or simply wait — your claim will be processed within 2 hours automatically." },
];

const screens = [
  { id: 1, title: "Onboarding Flow", messages: screen1 },
  { id: 2, title: "Monday Notification", messages: screen2 },
  { id: 3, title: "Soft-hold Verification", messages: screen3 },
];

const WhatsAppMockups = () => {
  const [activeScreen, setActiveScreen] = useState(0);
  const current = screens[activeScreen];

  return (
    <div className="flex flex-col items-center min-h-screen bg-muted py-8 gap-6">
      <h1 className="text-lg font-bold text-foreground">WhatsApp Bot Mockups</h1>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {screens.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setActiveScreen(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              i === activeScreen ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Phone mockup */}
      <div className="w-[390px] rounded-3xl overflow-hidden border-4 border-foreground/10 shadow-lg bg-card">
        {/* WhatsApp header */}
        <div className="bg-[hsl(152,60%,28%)] px-3 py-2.5 flex items-center gap-3 text-[hsl(0,0%,100%)]">
          <ArrowLeft size={18} />
          <div className="w-8 h-8 rounded-full bg-[hsl(0,0%,100%)]/20 flex items-center justify-center">
            <Shield size={14} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">InsurGig Bot</p>
            <p className="text-[10px] opacity-75">online</p>
          </div>
          <Video size={18} />
          <Phone size={18} />
          <MoreVertical size={18} />
        </div>

        {/* Chat area */}
        <div className="bg-[hsl(30,25%,92%)] px-3 py-4 space-y-2 min-h-[500px] max-h-[600px] overflow-y-auto">
          {current.messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-pre-line ${
                  msg.from === "user"
                    ? "bg-[hsl(120,35%,80%)] text-[hsl(0,0%,10%)]"
                    : "bg-[hsl(0,0%,100%)] text-[hsl(0,0%,10%)]"
                }`}
              >
                {msg.text}
                {msg.hasButton && (
                  <div className="mt-2 pt-2 border-t border-[hsl(0,0%,85%)]">
                    <div className="bg-[hsl(152,60%,28%)] text-[hsl(0,0%,100%)] text-center py-2 rounded font-medium text-[11px]">
                      {msg.hasButton}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMockups;
