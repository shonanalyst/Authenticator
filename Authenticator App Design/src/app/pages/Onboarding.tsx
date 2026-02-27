import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, Key, Lock, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";

const steps = [
  {
    icon: Shield,
    title: "Welcome to Authenticator",
    description: "Secure your accounts with two-factor authentication. Keep all your 2FA codes in one place.",
  },
  {
    icon: Key,
    title: "Easy Setup",
    description: "Scan QR codes or enter secret keys to add your accounts. We'll generate time-based codes automatically.",
  },
  {
    icon: Lock,
    title: "Stay Protected",
    description: "Your codes are stored securely on your device. Access them anytime, even offline.",
  },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem("onboarding_completed", "true");
      navigate("/auth");
    }
  };

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    navigate("/auth");
  };

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="h-screen max-w-[430px] mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="mb-12 flex justify-center">
            <div className="h-28 w-28 bg-white/90 backdrop-blur rounded-3xl flex items-center justify-center shadow-lg">
              <Icon className="h-14 w-14 text-blue-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4 px-4">
            {currentStepData.title}
          </h1>
          
          <p className="text-gray-600 mb-12 leading-relaxed px-6 text-lg">
            {currentStepData.description}
          </p>

          <div className="flex gap-2 justify-center mb-16">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-gray-300"
                }`}
              />
            ))}
          </div>

          <div className="flex flex-col gap-3 px-6">
            <Button
              onClick={handleNext}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl text-base"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                "Get Started"
              )}
            </Button>
            {currentStep < steps.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full h-14 rounded-2xl text-base"
              >
                Skip
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}