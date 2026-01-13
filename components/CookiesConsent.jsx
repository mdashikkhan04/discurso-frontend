"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { setCookiesConsent } from "@/actions/auth";
import { Shield } from "lucide-react";

export default function CookiesConsent() {
  const [hasAgreed, setHasAgreed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hasAgreed !== null) return;
    const consent = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("cookies="))
      ?.split("=")[1];

    if (consent === "agreed") setHasAgreed(true);
  }, []);

  const submitConsent = async (consentType) => {
    setIsLoading(true);
    try {
      const bSet = await setCookiesConsent(consentType);
      if (bSet) {
        const agreed = consentType === "all" || consentType === "necessary";
        setHasAgreed(agreed);
      } else {
        console.error("Failed to set cookies consent");
      }
    } catch (error) {
      console.error("Error setting cookies consent:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (process.env.NEXT_PUBLIC_PSEVASD) {
    return null;
  }

  if (hasAgreed !== null) {
    return null;
  }

  return (
    <div className="fixed bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 z-40 flex justify-center animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200/50 p-4 sm:p-6 w-full max-w-4xl ring-1 ring-black/5">
        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex-shrink-0 p-2 bg-vivid-blue/25 rounded-xl sm:rounded-2xl">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-vivid-blue" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Your Privacy, Our Priority
              </h3>
              <p className="text-sm text-gray-800 leading-relaxed mb-2">
                At Discurso.AI, we're committed to protecting your privacy while delivering an exceptional negotiation training experience. We use carefully selected cookies to:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-3 sm:ml-4 mb-2 sm:mb-3">
                <li className="flex items-start gap-2">
                  <span className="text-vivid-blue flex-shrink-0">•</span>
                  <span>Securely remember your preferences and progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vivid-blue flex-shrink-0">•</span>
                  <span>Personalize your learning journey and AI feedback</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-vivid-blue flex-shrink-0">•</span>
                  <span>Continuously improve our platform based on anonymized insights</span>
                </li>
              </ul>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Your data is never sold to third parties. You can adjust your preferences at any time in your account settings.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <Button
                onClick={() => submitConsent("all")}
                disabled={isLoading}
                className="bg-gradient-to-r from-vivid-blue/75 to-deep-blue/75 hover:vivid-blue hover:to-deep-blue text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Setting...</span>
                  </div>
                ) : (
                  "Accept All"
                )}
              </Button>
              <Button
                onClick={() => submitConsent("necessary")}
                disabled={isLoading}
                variant="outline"
                className="border-2 border-vivid-blue/20 text-vivid-blue hover:text-deep-blue hover:bg-vivid-blue/5 hover:border-vivid-blue/40 rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm disabled:transform-none text-sm sm:text-base"
              >
                Accept Necessary
              </Button>
              <Button
                onClick={() => submitConsent("reject")}
                disabled={isLoading}
                variant="outline"
                className="border-2 border-gray-300/60 text-gray-600 hover:border-red-400/60 hover:text-red-600 hover:bg-red-50/80 rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold transition-all duration-300 transform hover:scale-[1.02] backdrop-blur-sm disabled:transform-none text-sm sm:text-base"
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
