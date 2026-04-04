import { useState } from "react";
import { Shield } from "lucide-react";

const languages = ["English", "हिंदी", "தமிழ்", "తెలుగు", "ಕನ್ನಡ"];

interface Props {
  onGetStarted: () => void;
  onLogin: () => void;
}

const OnboardingScreen = ({ onGetStarted, onLogin }: Props) => {
  const [selectedLang, setSelectedLang] = useState("English");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-secondary">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-10 h-10 rounded-card bg-primary flex items-center justify-center">
          <Shield size={22} className="text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold text-foreground tracking-tight">InsurGig</span>
      </div>

      <h1 className="text-3xl font-extrabold text-foreground text-center leading-tight">
        Your income, protected.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground text-center max-w-[280px] leading-relaxed">
        Quick form, mobile verification, then WhatsApp-style updates and a simple demo payment — all in one flow.
      </p>

      <div className="flex flex-wrap justify-center gap-2 mt-8">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => setSelectedLang(lang)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedLang === lang
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <button
        onClick={onGetStarted}
        className="mt-10 w-full max-w-[300px] bg-accent text-accent-foreground font-semibold py-3.5 rounded-button text-sm transition-opacity hover:opacity-90"
      >
        Start application
      </button>
      <button
        type="button"
        onClick={onLogin}
        className="mt-3 w-full max-w-[300px] border border-border bg-card text-foreground font-semibold py-3 rounded-button text-sm hover:bg-muted/50 transition-colors"
      >
        Log in
      </button>
      <p className="mt-3 text-xs text-muted-foreground">No app download required to begin</p>
    </div>
  );
};

export default OnboardingScreen;
