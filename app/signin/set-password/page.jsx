"use client";

import { useEffect, useState, Suspense } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { useSearchParams } from "next/navigation";
import { getSigninToken, setSession, setEmailVerified, deleteCookieConsent } from "@/actions/auth";
import { loginWithCustomToken, resetPassword, getUserRole } from "@/lib/client/auth"
import { showSuccessToast, showErrorToast } from "@/components/toast";
import { motion } from "motion/react";
import { Lock, Shield, Key, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TermsForm from "@/components/TermsForm";

function SetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordMatch, setPasswordMatch] = useState(true);
    const [signedIn, setSignedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [actualToken, setActualToken] = useState(false);
    const { showLoading, hideLoading } = useLoading();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        if (signedIn || !token) return;
        (async () => {
            showLoading();
            try {
                const customToken = await getSigninToken(token);
                const signedInUser = await loginWithCustomToken(customToken);
                const freshToken = await signedInUser.getIdToken(true);
                setActualToken(freshToken);
                setSignedIn(true);
                setUser(signedInUser);
            } catch (error) {
                console.error("Error during sign-in:", error);
                showErrorToast("Failed to sign in. The link may be invalid or expired.");
            } finally {
                hideLoading();
            }
        })();
    }, [token]);

    useEffect(() => {
        if (confirmPassword) {
            setPasswordMatch(password === confirmPassword);
        }
    }, [password, confirmPassword]);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!passwordMatch || !password || !termsAccepted) return;
        showLoading();

        try {
            await resetPassword(user, password);
        } catch (error) {
            console.error("Error setting password:", error);
            showErrorToast("Failed to set password. Please try again.");
            hideLoading();
            return;
        }

        showSuccessToast("Password has been set");
        setPassword("");
        setConfirmPassword("");

        try {
            await setEmailVerified(true, actualToken);
        } catch (error) {
            console.warn("Failed to set email verified:", error);
        }

        try {
            const userRole = await setSession(actualToken, user.email);
            showSuccessToast("Welcome! Your account is ready.");
            window.location.href = `/${userRole}`;
        } catch (error) {
            console.error("Error establishing session after password set:", error);
            const msg = error?.message || "";
            if (msg.includes("Cookie consent required")) {
                try { await deleteCookieConsent(); } catch (err) { console.warn("Failed to clear cookie consent:", err); }
                showErrorToast("Password set. Please accept cookies to continue.");
                window.location.reload();
            } else if (msg.includes("Terms not accepted")) {
                showErrorToast("Password set. Please accept the terms to continue.");
            } else {
                showErrorToast("Password set, but we couldn't complete sign-in. Please sign in again.");
            }
        }

        hideLoading();
    }

    const handleTermsAccept = (accepted) => {
        setTermsAccepted(accepted);
        hideLoading();
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-soft-white via-white to-pale-blue/20">
            <div className="absolute inset-0 bg-gradient-to-br from-vivid-blue/5 via-transparent to-deep-blue/5 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,197,253,0.06),transparent_50%)] pointer-events-none" />

            <div className="relative m-2 sm:m-4 p-2 sm:p-3 rounded-3xl bg-gradient-to-br from-vivid-blue via-vivid-blue to-deep-blue min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] shadow-2xl ring-1 ring-black/5">
                <svg
                    className="hidden lg:block absolute inset-0 w-full h-full z-0 pointer-events-none opacity-30"
                    viewBox="0 0 1000 600"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" strokeOpacity="0.08" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <circle
                        cx="50%"
                        cy="110%"
                        r="450"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                        strokeDasharray="6 8"
                        strokeOpacity="0.15"
                    />
                    <circle
                        cx="50%"
                        cy="110%"
                        r="600"
                        fill="none"
                        stroke="white"
                        strokeWidth="1"
                        strokeDasharray="6 8"
                        strokeOpacity="0.1"
                    />
                </svg>

                <div className="flex min-h-full items-center justify-center p-3 sm:p-4 lg:p-6 relative z-10">
                    <motion.section
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            transition: {
                                duration: 0.6,
                                type: "spring",
                                stiffness: 120,
                                damping: 20
                            }
                        }}
                        className="w-full max-w-md"
                    >
                        <div className="p-4 sm:p-6 lg:p-8 rounded-3xl border border-white/20 bg-white/25 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.1)] relative overflow-hidden">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

                            <div className="relative z-10">
                                {signedIn ? (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: { delay: 0.2, duration: 0.5 }
                                            }}
                                            className="flex items-center justify-center mb-6"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-white/75 rounded-xl blur-md scale-125"></div>
                                                    <img
                                                        src="/land/discurso_logo.png"
                                                        alt="Discurso.AI Logo"
                                                        className="relative h-10 w-10 rounded-lg"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                                        Discurso.<span className="relative text-blue-500">
                                                            <span className="absolute inset-0 bg-white/75 blur-sm scale-125 rounded-2xl"></span>
                                                            <span className="relative">AI</span>
                                                        </span>
                                                    </h1>
                                                    <div className="h-0.5 w-12 bg-gradient-to-r from-blue-200 to-white/60 rounded-full mt-1 mx-auto"></div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: 1,
                                                transition: { delay: 0.3, duration: 0.5 }
                                            }}
                                            className="text-center mb-6"
                                        >
                                            <div className="flex items-center justify-center gap-3 mb-3">
                                                <div className="flex-shrink-0 p-2 bg-white/25 rounded-2xl">
                                                    <Key className="w-6 h-6 text-white/75" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl font-bold text-white">Set Your Password</h2>
                                                    <p className="text-sm text-white/95 mt-1">Secure your account</p>
                                                </div>
                                            </div>
                                            <p className="text-white/95 text-sm leading-relaxed">
                                                Create a strong password to protect your negotiation training account and progress.
                                            </p>
                                        </motion.div>

                                        <motion.form
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: { delay: 0.4, duration: 0.5 }
                                            }}
                                            onSubmit={handleResetPassword}
                                            className="space-y-4"
                                        >
                                            <div className="space-y-2">
                                                <Label htmlFor="password" className="text-white/95 font-medium text-sm flex items-center gap-2">
                                                    <Lock className="w-3.5 h-3.5" />
                                                    New Password
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="password"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your new password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required
                                                        className="bg-white/60 border-white/30 text-gray-800 placeholder:text-gray-600 rounded-xl h-11 backdrop-blur-sm focus:text-black focus:bg-white/70 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-3 pr-10 text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="confirmPassword" className="text-white/95 font-medium text-sm flex items-center gap-2">
                                                    <Shield className="w-3.5 h-3.5" />
                                                    Confirm Password
                                                </Label>
                                                <div className="relative">
                                                    <Input
                                                        id="confirmPassword"
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Confirm your new password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required
                                                        className={`bg-white/60 border-white/30 text-gray-800 placeholder:text-gray-600 rounded-xl h-11 backdrop-blur-sm focus:text-black focus:bg-white/70 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-3 pr-10 text-sm ${!passwordMatch ? 'ring-2 ring-red-400/50 border-red-400/50' : ''
                                                            }`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
                                                    >
                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                    </button>
                                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                                                </div>
                                                {!passwordMatch && confirmPassword && (
                                                    <motion.p
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="text-red-700 text-sm font-semibold mt-1 flex items-center gap-1"
                                                    >
                                                        <span className="w-3 h-3 rounded-2xl bg-red-400/50 flex items-center justify-center text-red-700 text-sm font-bold p-2">!</span>
                                                        Passwords do not match
                                                    </motion.p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-center w-full mt-6">
                                                <Button
                                                    type="submit"
                                                    disabled={!passwordMatch || !password}
                                                    className="w-full bg-white text-vivid-blue hover:bg-blue-50 hover:scale-[1.02] disabled:bg-white/60 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:scale-100 rounded-xl h-11 font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"
                                                >
                                                    <Key className="w-4 h-4 mr-2" strokeWidth={2.5} />
                                                    Set Password
                                                </Button>
                                            </div>
                                        </motion.form>
                                    </>
                                ) : (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{
                                                opacity: 1,
                                                y: 0,
                                                transition: { delay: 0.2, duration: 0.5 }
                                            }}
                                            className="flex items-center justify-center mb-6"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-white/75 rounded-xl blur-md scale-125"></div>
                                                    <img
                                                        src="/land/discurso_logo.png"
                                                        alt="Discurso.AI Logo"
                                                        className="relative h-10 w-10 rounded-lg"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                                        Discurso.<span className="relative text-blue-500">
                                                            <span className="absolute inset-0 bg-white/75 blur-sm scale-125 rounded-2xl"></span>
                                                            <span className="relative">AI</span>
                                                        </span>
                                                    </h1>
                                                    <div className="h-0.5 w-12 bg-gradient-to-r from-blue-200 to-white/60 rounded-full mt-1 mx-auto"></div>
                                                </div>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{
                                                opacity: 1,
                                                transition: { delay: 0.3, duration: 0.5 }
                                            }}
                                            className="text-center"
                                        >
                                            <div className="flex items-center justify-center gap-3 mb-4">
                                                <div className="flex-shrink-0 p-2 bg-white/25 rounded-2xl">
                                                    <Key className="w-6 h-6 text-white/75" strokeWidth={2.5} />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl sm:text-2xl font-bold text-white">Set Your Password</h2>
                                                    <p className="text-sm text-white/95 mt-1">Email verification required</p>
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
                                                <p className="text-white text-sm leading-relaxed">
                                                    Please use the secure link provided in your email to set your password and complete your account setup.
                                                </p>
                                                <div className="mt-3 flex items-center justify-center gap-2 text-white/95 text-xs">
                                                    <Shield className="w-3 h-3" />
                                                    <span>Secure authentication required</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.section>
                </div>
            </div>

            {signedIn && !termsAccepted && user?.email && (
                <TermsForm
                    onClose={handleTermsAccept}
                    email={user.email}
                />
            )}
        </div>
    );
}

export default function Page() {
    return (
        <Suspense>
            <SetPasswordPage />
        </Suspense>
    );
}
