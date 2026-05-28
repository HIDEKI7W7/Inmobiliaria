'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { decodeToken, getRedirectPathByRole, saveToken } from '@/utils/session';

export default function SocialCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const token = hashParams.get('token');
    const next = hashParams.get('next');

    if (!token) {
      router.replace('/login');
      return;
    }

    saveToken(token);
    window.history.replaceState({}, document.title, '/auth/social-callback');

    const payload = decodeToken(token);
    const fallback = payload
      ? getRedirectPathByRole(payload.role, payload.objective, payload.onboardingCompleted)
      : '/onboarding';

    router.replace(next || fallback);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#f4f7fb] flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
        <div className="mx-auto mb-5 h-11 w-11 rounded-2xl bg-[#04045E] flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
        <h1 className="text-lg font-black text-[#04045E]">Validando acceso</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Estamos preparando tu experiencia personalizada en Propio.
        </p>
      </div>
    </main>
  );
}
