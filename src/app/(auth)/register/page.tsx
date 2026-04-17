'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/validations/auth';
import { ZodError } from 'zod';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate with Zod
      registerSchema.parse(formData);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      toast.success('Registration successful! Please verify your email.');
      router.push(`/verify-otp?userId=${result.data.userId}&email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      if (error instanceof ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#FAFAFA] p-10 border border-[#E5E5E5] text-center shadow-sm">
        <h1 className="font-display text-4xl text-black mb-2">Create Account</h1>
        <p className="font-body text-sm text-[#737373] mb-10 tracking-tight">Join our luxury shopping community.</p>

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest text-black">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ahmed Khan"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full p-4 border-[#E5E5E5] rounded-none focus:border-black focus:ring-0 outline-none bg-white text-black h-12"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[10px] uppercase font-bold tracking-widest text-black">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ahmed@example.com"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full p-4 border-[#E5E5E5] rounded-none focus:border-black focus:ring-0 outline-none bg-white text-black h-12"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[10px] uppercase font-bold tracking-widest text-black">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full p-4 border-[#E5E5E5] rounded-none focus:border-black focus:ring-0 outline-none bg-white text-black h-12"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black hover:bg-[#262626] text-white py-6 uppercase tracking-widest font-bold rounded-none transition-colors h-14"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-between">
          <span className="h-px bg-[#E5E5E5] flex-1"></span>
          <span className="mx-4 text-[10px] uppercase tracking-widest text-[#A3A3A3]">or</span>
          <span className="h-px bg-[#E5E5E5] flex-1"></span>
        </div>

        <Button
          onClick={handleGoogleLogin}
          type="button"
          variant="outline"
          className="w-full mt-8 border-black hover:bg-black hover:text-white text-black py-6 uppercase tracking-widest font-bold rounded-none transition-all flex items-center justify-center gap-3 h-14 bg-transparent"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

        <p className="mt-8 font-body text-xs text-[#737373]">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-bold underline underline-offset-4">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
