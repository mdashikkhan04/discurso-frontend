"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from 'react-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@/contexts/UserContext";
import {
  checkCaptcha,
  joinList,
  getSignInPreflight,
  deleteCookieConsent,
} from "@/actions/auth";
import {
  loginUser,
  sendPasswordReset,
  sendEmailVerificationEmail,
  getUserRole,
} from "@/lib/client/auth";
import { useLoading } from "@/contexts/LoadingContext";
import ReCAPTCHA from "react-google-recaptcha";
import TermsForm from "@/components/TermsForm";
import { motion } from "motion/react";
import { User, Mail, Lock, Shield } from "lucide-react";
import { showSuccessToast } from "@/components/toast";

function SignPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaValue, setCaptchaValue] = useState(null);
  const [mode, setMode] = useState("login");
  const [showTerms, setShowTerms] = useState(false);
  const [showCookieDialog, setShowCookieDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contextUser = useUser();
  const userRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    userRef.current = contextUser?.user || null;
  }, [contextUser])

  useEffect(() => {
    const presetMode = searchParams.get("mode");
    if (presetMode) {
      setMode(presetMode);
    }
  }, [searchParams]);

  const verifyCaptcha = async () => {
    if (!captchaValue) return false;
    const bVerified = await checkCaptcha(captchaValue);
    return bVerified;
  }

  const clearInput = () => {
    setEmail("");
    setPassword("");
    setIsForgotPasswordOpen(false);
    setErrorMessage("");
  };

  const handleAcceptedTerms = async (accepted) => {
    setShowTerms(false);
    if (accepted) {
      setErrorMessage("");
      showLoading();
      await handleLogin(null, true, true);
      return;
    } else {
      setErrorMessage(
        "You must accept the Terms and Conditions to continue"
      );
    }
  }

  const handleCookieAcceptance = async () => {
    setShowCookieDialog(false);
    setErrorMessage("");
    // window.location.reload();
  }

  const handleLogin = async (e, verifyEmail, skipTerms) => {
    if (e) e.preventDefault();
    if (!email || !password) return;
    showLoading();
    try {
      // const { cookiesAccepted, termsAccepted } = await getSignInPreflight(email);
      // if (!cookiesAccepted) {
      //   await deleteCookieConsent();
      //   setErrorMessage("We need to use cookies to manage your user session. Please accept cookies to continue.");
      //   setShowCookieDialog(true);
      //   hideLoading();
      //   return;
      // }
      await loginUser(email, password);
      let user, interval = 100;
      for (let ms = 0; ms < 60000; ms += interval) {
        await new Promise(resolve => setTimeout(resolve, interval));
        if (userRef.current) {
          user = userRef.current;
          break;
        }
      }
      if (!user) {
        throw new Error("Signin timed out");
      }
      // && !termsAccepted
      if (!skipTerms ) {
        setErrorMessage("Please accept the Terms & Conditions and Privacy Policy");
        setShowTerms(true);
        hideLoading();
        return;
      }
      if (verifyEmail || !user.emailVerified) {
        sendEmailVerificationEmail(user);
      }
      const token = await user.getIdToken(true);
      const role = getUserRole(user);
      const redirectPath = searchParams.get("redirect");
      if (redirectPath) {
        router.replace(redirectPath);
      } else if (role) {
        router.replace(`/${role}`);
      } else {
        router.replace("/");
      }
      hideLoading();
      return;
    } catch (error) {
      console.error(error);
      console.debug(error.message);
      if (error.message?.includes("user-disabled")) {
        setErrorMessage("Please contact Discurso team");
      } else if (error.message?.includes("invalid-credential")) {
        setErrorMessage("Incorrect email or password");
      } else if (error.message?.includes("timed out")) {
        setErrorMessage("Sign in has timed out. Please check your connection");
      } else {
        setErrorMessage("Failed to login. Please contact Discurso team");
      }
    }
    hideLoading();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage("Email required");
      return;
    }
    showLoading();
    try {
      let bCaptchaVerified = await verifyCaptcha();
      setCaptchaValue(null);
      if (!bCaptchaVerified) throw new Error("Failed captcha");
      const bJoined = await joinList(email);
      if (bJoined) {
        clearInput();
        showSuccessToast("Successfully joined the waiting list! We'll notify you soon.");
      } else {
        setErrorMessage("Registration failed");
      }
    } catch (error) {
      if (error.message.includes("captcha")) {
        setErrorMessage("Failed captcha");
      } else {
        setErrorMessage("Registration failed");
      }
      console.error(error);
    }
    hideLoading();
  };

  const handleResetPassword = async () => {
    if (!resetEmail) return;
    showLoading();
    try {
      let bCaptchaVerified = await verifyCaptcha();
      setCaptchaValue(null);
      if (!bCaptchaVerified) throw new Error("Failed captcha");
      await sendPasswordReset(resetEmail);
      setResetError("");
      setResetMessage(
        `An email to reset your password has been sent to ${resetEmail}.`
      );
      setResetEmail("");
    } catch (error) {
      setResetMessage("");
      if (error.message.includes("captcha")) {
        setResetError("Failed captcha check");
      } else {
        setResetError("Error sending password reset email.");
      }
    }
    hideLoading();
  };

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
                  <p className="text-white/95 mb-2 text-base sm:text-lg font-medium leading-relaxed">
                    Master the Art of<span className="relative text-blue-500 font-semibold">
                      <span className="absolute inset-0 bg-white/75 blur-sm scale-100"></span>
                      <span className="relative"> Professional Negotiation </span>
                    </span>
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: 0.5, duration: 0.5 }
                  }}
                >
                  <Tabs defaultValue="login" className="w-full" value={mode} onValueChange={(tab) => setMode(tab)}>
                    <TabsList className="grid grid-cols-2 mb-6 bg-white/20 backdrop-blur-sm border border-white/25 rounded-full p-1 shadow-inner h-10">
                      <TabsTrigger
                        value="login"
                        className="rounded-full text-white data-[state=active]:bg-white data-[state=active]:text-vivid-blue font-semibold text-sm h-8 transition-all duration-300 data-[state=active]:shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Sign In</span>
                      </TabsTrigger>
                      <TabsTrigger
                        value="signup"
                        className="rounded-full text-white data-[state=active]:bg-white data-[state=active]:text-vivid-blue font-semibold text-sm h-8 transition-all duration-300 data-[state=active]:shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Sign up</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="login">
                      <form className="space-y-4" onSubmit={handleLogin}>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/95 font-medium text-sm flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" />
                            Email Address
                          </Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-white/60 border-white/30 text-gray-800 placeholder:text-gray-800 rounded-xl h-11 backdrop-blur-sm focus:text-black focus:bg-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-3 text-sm"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-white/95 font-medium text-sm flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5" />
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="bg-white/60 border-white/30 text-gray-800 placeholder:text-gray-800 rounded-xl h-11 backdrop-blur-sm focus:text-black focus:bg-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-3 text-sm"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center w-full mt-6">
                          <Button
                            type="submit"
                            className="w-full bg-white text-vivid-blue hover:bg-blue-50 hover:scale-[1.02] rounded-xl h-11 font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"
                          >
                            <Shield className="w-4 h-4 mr-2" strokeWidth={3} />
                            Sign In
                          </Button>
                        </div>
                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            className="text-blue-100 text-sm hover:text-white transition-colors hover:underline font-medium inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/10"
                            onClick={() => setIsForgotPasswordOpen(true)}
                          >
                            <Lock className="w-3 h-3" strokeWidth={2} />
                            Forgot your password?
                          </button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="signup">
                      {mode === "signup" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{
                            opacity: 1,
                            transition: { delay: 0.4, duration: 0.5 }
                          }}
                          className="text-center mb-6 p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20"
                        >
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <User className="w-4 h-4 text-white/95" />
                            <span className="text-white font-semibold text-sm">Join the Waiting List</span>
                          </div>
                          <p className="text-white/95 text-sm leading-relaxed">
                            Be among the first to experience our revolutionary AI-powered negotiation training platform.
                          </p>
                        </motion.div>
                      )}
                      <form className="space-y-4" onSubmit={handleSignup}>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-white/95 font-medium text-sm flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5" />
                            Email Address
                          </Label>
                          <div className="relative">
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="bg-white/60 border-white/30 text-gray-800 placeholder:text-gray-800 rounded-xl h-11 backdrop-blur-sm focus:text-black focus:bg-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-3 text-sm"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center w-full">
                          <ReCAPTCHA
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                            onChange={(value) => setCaptchaValue(value)}
                            theme="light"
                          />
                        </div>

                        <div className="flex items-center justify-center w-full mt-6">
                          <Button
                            type="submit"
                            className="w-full bg-white text-vivid-blue hover:bg-blue-50 hover:scale-[1.02] rounded-xl h-11 font-semibold text-sm shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20"
                          >
                            <User className="w-4 h-4 mr-2" />
                            Join Waiting List
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </motion.div>

                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      transition: { duration: 0.3 }
                    }}
                    className="mt-4 p-3 bg-red-500/25 backdrop-blur-sm rounded-xl border border-red-300/30 shadow-lg"
                  >
                    <div className="flex items-center gap-2 text-red-700">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-red-400/25 flex items-center justify-center">
                        <span className="text-red-700 text-sm font-bold">!</span>
                      </div>
                      <span className="font-semibold text-sm sm:text-sm">{errorMessage}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {isForgotPasswordOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl ring-1 ring-black/5 border border-gray-200/50 overflow-hidden"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-shrink-0 p-3 bg-vivid-blue/10 rounded-2xl">
                        <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-vivid-blue" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Reset Password</h3>
                        <p className="text-sm text-gray-600 mt-1">Get back to your account</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-800 leading-relaxed mb-4">
                        Enter your email address and we'll send you a secure link to reset your password and regain access to your account.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="resetEmail" className="text-gray-700 font-medium text-sm flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="Enter your registered email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="bg-white/60 border-white/30 text-gray-800 placeholder:text-gray-800 rounded-xl h-11 backdrop-blur-sm focus:text-black focus:bg-white/40 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all duration-300 pl-3 text-sm"
                        />
                      </div>

                      <div className="flex justify-center">
                        <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-200/60 shadow-inner">
                          <ReCAPTCHA
                            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                            onChange={(value) => setCaptchaValue(value)}
                            theme="light"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4 justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsForgotPasswordOpen(false);
                          setResetEmail("");
                          setResetMessage("");
                          setResetError("");
                          setCaptchaValue(null);
                        }}
                        className="border-2 border-gray-300/60 text-gray-600 hover:border-gray-400/60 hover:text-gray-800 hover:bg-gray-50/80 rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleResetPassword}
                        className="bg-vivid-blue/75 hover:bg-vivid-blue text-white rounded-full px-6 sm:px-8 py-2.5 sm:py-3 h-auto font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        disabled={!resetEmail}
                      >
                        <Lock className="w-4 h-4" />
                        Send Reset Link
                      </Button>
                    </div>

                    {resetMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-green-50/80 border border-green-200/60 rounded-2xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                            <span className="text-green-600 text-xs font-bold">✓</span>
                          </div>
                          <p className="text-green-700 text-sm leading-relaxed">{resetMessage}</p>
                        </div>
                      </motion.div>
                    )}
                    {resetError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-4 bg-red-50/80 border border-red-200/60 rounded-2xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                            <span className="text-red-600 text-xs font-bold">!</span>
                          </div>
                          <p className="text-red-700 text-sm leading-relaxed">{resetError}</p>
                        </div>
                      </motion.div>
                    )}

                    <p className="text-sm text-gray-600 text-center mt-4 leading-relaxed">
                      The reset link will be valid for 24 hours. Check your spam folder if you don't see the email.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {showTerms && (
              <TermsForm onClose={handleAcceptedTerms} email={email} />
            )}

            {showCookieDialog && isMounted && createPortal(
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white/95 backdrop-blur-xl rounded-3xl max-w-md w-full shadow-2xl ring-1 ring-black/5 border border-gray-200/50 overflow-hidden"
                >
                  <div className="p-6 sm:p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-shrink-0 p-3 bg-orange-500/10 rounded-2xl">
                        <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" strokeWidth={2.5} />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Cookies Required</h3>
                        <p className="text-sm text-gray-600 mt-1">Essential for user sessions</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-gray-800 leading-relaxed mb-4">
                        We need to use essential cookies to manage your user session and keep you logged in securely.
                        These cookies are necessary for the platform to function properly.
                      </p>
                      <div className="bg-orange-50/80 border border-orange-200/60 rounded-xl p-3">
                        <p className="text-orange-800 text-sm font-medium">
                          Please accept necessary cookies using the cookie consent banner at the bottom of the page, then try signing in again.
                        </p>
                      </div>
                    </div>

                    {/* <div className="flex justify-center">
                      <Button
                        onClick={handleCookieAcceptance}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-11 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Got it - I'll accept cookies below
                      </Button>
                    </div> */}

                    <p className="text-xs text-gray-600 text-center mt-4 leading-relaxed">
                      We only use essential cookies for authentication and session management. No tracking or advertising cookies are used.
                    </p>
                  </div>
                </motion.div>
              </motion.div>,
              document.body
            )}
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense>
      <SignPage />
    </Suspense>
  );
}
