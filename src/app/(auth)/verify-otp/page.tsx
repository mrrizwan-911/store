'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Handle OTP input change
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only numbers

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last char
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Paste handler
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);

    // Focus last filled or next empty
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      toast.error('Please enter the full 6-digit code');
      return;
    }

    if (!userId) {
      toast.error('User ID is missing. Please register again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Invalid or expired OTP');
      }

      toast.success('Email verified successfully!');
      router.push('/login');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    toast.info('Feature coming soon: Resending OTP...');
    // In a real app, call a resend-otp endpoint here
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#FAFAFA] p-10 border border-[#E5E5E5] text-center shadow-sm">
        <h1 className="font-display text-4xl text-black mb-4">Verify Email</h1>
        <p className="font-body text-sm text-[#737373] mb-10 tracking-tight">
          Enter the 6-digit code sent to <br />
          <span className="text-black font-medium">{email || 'your email'}</span>.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-10" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                value={digit}
                maxLength={1}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 border border-[#E5E5E5] rounded-none text-center text-xl font-body bg-white text-black focus:border-black focus:ring-0 outline-none transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={isLoading || timeLeft === 0}
            className="w-full bg-black hover:bg-[#262626] text-white py-6 uppercase tracking-widest font-bold rounded-none transition-colors h-14"
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>
        </form>

        <div className="mt-8 space-y-4">
          <p className="text-[10px] uppercase tracking-widest text-[#A3A3A3]">
            Code expires in <span className="text-black font-bold font-mono">{formatTime(timeLeft)}</span>
          </p>

          <button
            onClick={handleResend}
            disabled={timeLeft > 540} // Allow resend after 1 minute
            className="text-[10px] uppercase tracking-widest text-black font-bold underline underline-offset-4 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center font-body text-sm tracking-widest uppercase text-neutral-400">
        Loading...
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
