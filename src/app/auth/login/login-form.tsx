"use client";

import { useActionState } from "react";
import { signIn, type SignInState } from "@/lib/actions/auth";

const initialState: SignInState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-brand-cream"
        >
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 block w-full rounded-md border border-brand-border-dark bg-brand-bg-dark px-3 py-2 text-brand-cream placeholder-brand-muted focus:border-brand-sky-light focus:outline-none focus:ring-1 focus:ring-brand-sky-light"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-brand-cream"
        >
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 block w-full rounded-md border border-brand-border-dark bg-brand-bg-dark px-3 py-2 text-brand-cream placeholder-brand-muted focus:border-brand-sky-light focus:outline-none focus:ring-1 focus:ring-brand-sky-light"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-400" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-brand-sky px-4 py-2 font-medium text-white transition hover:bg-brand-sky-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
