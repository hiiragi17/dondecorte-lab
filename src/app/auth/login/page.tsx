import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "ログイン | DonDecorte Lab",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-brand-bg-dark px-4 py-12">
      <div className="w-full max-w-sm rounded-lg border border-brand-border-dark bg-brand-card-dark p-6 shadow-lg">
        <h1 className="mb-6 text-center text-xl font-bold text-brand-cream">
          管理画面ログイン
        </h1>
        <LoginForm />
      </div>
    </main>
  );
}
