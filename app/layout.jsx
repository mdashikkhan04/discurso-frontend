import { UserProvider } from "@/contexts/UserContext";
import ToastProvider from "@/components/ToastProvider";
import { LoadingProvider } from "@/contexts/LoadingContext";
import CookiesConsent from "@/components/CookiesConsent";
import { GoogleAnalytics } from "@next/third-parties/google";
import { cookies } from "next/headers";
import { jakartaSans } from "@/lib/fonts/jakartaSans";
import "./globals.css";

export const metadata = {
  title: "Discurso - Negotiation Training Platform",
  description:
    "Enhance your negotiation skills with interactive simulations, AI-driven feedback, and comprehensive reports.",
};

export default async function RootLayout({ children }) {
  const environ = process.env.NEXT_PUBLIC_ENVIRON;
  const cookieStore = await cookies();
  const cookiesConsent = cookieStore.get("cookies")?.value || null;
  const hasSavedConsent = Boolean(cookiesConsent);
  const allCookiesAccepted = cookiesConsent === "all";
  return (
    <html lang="en">
      <body
        className={`${jakartaSans.className} antialiased text-black`}
      >
        <ToastProvider>
          <LoadingProvider>
            <UserProvider>
              <main data-bg={environ}>{children}</main>
              {!hasSavedConsent && <CookiesConsent />}
            </UserProvider>
          </LoadingProvider>
        </ToastProvider>
        {allCookiesAccepted && (
          <GoogleAnalytics
            gaId={`${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`}
          />
        )}
        <script src="/html2canvas.min.js"></script>
      </body>
    </html>
  );
}
