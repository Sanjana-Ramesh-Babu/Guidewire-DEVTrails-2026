import { useNavigate } from "react-router-dom";
import { Shield, Smartphone, MessageCircle, Monitor } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const interfaces = [
    {
      title: "Rider app",
      description: "Sign up with OTP & UPI, WhatsApp-style messages, demo payment, then home coverage & claims",
      icon: Smartphone,
      path: "/rider",
    },
    {
      title: "WhatsApp Bot Mockups",
      description: "Static mockups of the WhatsApp onboarding & notification flows",
      icon: MessageCircle,
      path: "/whatsapp",
    },
    {
      title: "Operations Dashboard",
      description: "Admin dashboard — overview, fraud alerts, analyst queue, triggers",
      icon: Monitor,
      path: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-secondary flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center">
          <Shield size={26} className="text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">InsurGig</h1>
      </div>
      <p className="text-sm text-muted-foreground mb-10 text-center max-w-md">
        AI-powered parametric income insurance for food delivery partners in India
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {interfaces.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="bg-card rounded-card border border-border p-6 text-left hover:border-primary/40 transition-colors group"
          >
            <item.icon size={28} className="text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h2 className="text-sm font-semibold text-foreground mb-1">{item.title}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Index;
