"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLoading } from "@/contexts/LoadingContext";
import Link from "next/link";
import { setTermsAccepted } from "@/actions/auth";
import { FileText } from "lucide-react";

export default function TermsForm({ onClose, email }) {
    const { showLoading, hideLoading } = useLoading();
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

    const handleSetTermsAccepted = async (acceptedTime) => {
        showLoading();
        try {
            const bSet = await setTermsAccepted(email, acceptedTime);
            if (bSet && onClose) onClose(Boolean(acceptedTime));
        } catch (error) {
            console.error("Error during terms update:", error);
        }
        // hideLoading(); // hiding loading done by parent
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl ring-1 ring-black/5 border border-gray-200/50 animate-in zoom-in-95 duration-300">
                <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-shrink-0 p-2 bg-vivid-blue/10 rounded-2xl">
                            <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-vivid-blue" strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Terms and Privacy</h2>
                            <p className="text-sm text-gray-600 mt-1">Required to continue</p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-sm text-gray-800 leading-relaxed mb-4">
                            To provide you with the best negotiation training experience, we need your agreement to our terms and policies. This ensures:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-2 ml-4 mb-4">
                            <li className="flex items-start gap-2">
                                <span className="text-vivid-blue flex-shrink-0">•</span>
                                <span>Your data and progress are protected</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-vivid-blue flex-shrink-0">•</span>
                                <span>Clear understanding of platform usage</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-vivid-blue flex-shrink-0">•</span>
                                <span>Transparent privacy practices</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-vivid-blue/10 to-pale-blue/75 rounded-2xl border border-blue-100/50 transition-all duration-200 hover:from-pale-blue/40 hover:to-pale-blue/30">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-1 h-5 w-5 text-vivid-blue rounded focus:ring-vivid-blue focus:ring-2 border-gray-300 transition-colors"
                            />
                            <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1">
                                I have carefully read and agree to the{" "}
                                <Link 
                                    href="/terms-of-service" 
                                    className="text-vivid-blue hover:text-deep-blue font-semibold hover:underline transition-colors"
                                    target="_blank"
                                >
                                    Terms of Service
                                </Link>
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-vivid-blue/10 to-pale-blue/75 rounded-2xl border border-blue-100/50 transition-all duration-200 hover:from-pale-blue/40 hover:to-pale-blue/30">
                            <input
                                type="checkbox"
                                id="privacy"
                                checked={acceptedPrivacy}
                                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                                className="mt-1 h-5 w-5 text-vivid-blue rounded focus:ring-vivid-blue focus:ring-2 border-gray-300 transition-colors"
                            />
                            <Label htmlFor="privacy" className="text-sm text-gray-700 leading-relaxed cursor-pointer flex-1">
                                I understand and accept the{" "}
                                <Link 
                                    href="/privacy-policy" 
                                    className="text-vivid-blue hover:text-deep-blue font-semibold hover:underline transition-colors"
                                    target="_blank"
                                >
                                    Privacy Policy
                                </Link>
                            </Label>
                        </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { handleSetTermsAccepted(0); }}
                            className="border-2 border-gray-300/60 text-gray-600 hover:border-red-400/60 hover:text-red-600 hover:bg-red-50/80 rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                        >
                            Decline
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={!acceptedTerms || !acceptedPrivacy}
                            onClick={() => { handleSetTermsAccepted(Date.now()); }}
                            className="bg-gradient-to-r from-vivid-blue/75 to-deep-blue/75 hover:from-vivid-blue hover:to-deep-blue disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none"
                        >
                            Accept & Continue
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
                        Both documents open in a new tab. You can review them and return to continue.
                    </p>
                </div>
            </div>
        </div>
    );
}
