"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { checkCaptcha } from "@/actions/auth";
import { showErrorToast, showSuccessToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoading } from "@/contexts/LoadingContext";

function Join() {
  const searchParams = useSearchParams();
  const token = searchParams.get("invite");
  const { showLoading, hideLoading } = useLoading();

  const [valid, setValid] = useState(false);
  const [checked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [captchaValue, setCaptchaValue] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      showLoading();
      try {
        const { verifyJoinInvite } = await import("@/actions/auth");
        await verifyJoinInvite(token);
        setValid(true);
      } catch (e) {
        setValid(false);
        console.error(e);
        showErrorToast("Invalid or expired link");
      } finally {
        hideLoading();
        setChecked(true);
      }
    })();
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !email) return;
    setSubmitting(true);
    showLoading();
    try {
      if (!captchaValue) {
        throw new Error("Failed captcha");
      }
      const captchaOk = await checkCaptcha(captchaValue);
      setCaptchaValue(null);
      if (!captchaOk) {
        throw new Error("Failed captcha");
      }
      const { submitJoinEmail } = await import("@/actions/auth");
      await submitJoinEmail({ token, email, displayName });
      setSubmitted(true);
      showSuccessToast("Thanks! Please check your email for the account setup link.");
    } catch (e) {
      console.error(e);
      if ((e as any)?.message?.includes("captcha")) {
        showErrorToast("Failed captcha");
      } else {
        showErrorToast((e as any)?.message || "Could not process your request");
      }
    } finally {
      hideLoading();
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white via-white to-pale-blue/20 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl border border-pale-gray shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">Join Discurso.AI</h1>
        {!valid ? (
          <div className="text-md text-gray-600">{checked ? "Link invalid or expired" : "Checking your invite link…"}</div>
        ) : submitted ? (
          <div className="text-md text-gray-800">
            Thanks! You will receive a welcome link via email shortly. Please follow it to set your password and access your account.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </div>
            <div className="flex items-center justify-center w-full">
              <ReCAPTCHA
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string}
                onChange={(value) => setCaptchaValue(value)}
                theme="light"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">Join Discurso.AI</Button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <Join />
    </Suspense>
  );
}
