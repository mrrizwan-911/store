'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubmitted(true)
      setEmail('')
    }
  }

  return (
    <section className="py-32 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <span className="text-[10px] uppercase tracking-[0.6em] text-neutral-400 font-bold mb-8 block">
          Stay Connected
        </span>

        {isSubmitted ? (
          <div className="animate-in fade-in zoom-in duration-700">
            <CheckCircle2 className="w-16 h-16 text-black mx-auto mb-8 stroke-[1]" />
            <h2 className="font-display text-4xl md:text-5xl font-medium uppercase mb-6 tracking-tight">
              You&apos;re on the list
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto font-sans font-light">
              Thank you for joining our inner circle. Check your inbox soon for your exclusive 10% discount code.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-5xl md:text-7xl font-medium uppercase mb-10 tracking-tighter leading-[0.9]">
              Get 10% off <br /> <span className="italic font-light opacity-80">your first</span> order
            </h2>
            <p className="text-neutral-400 text-base md:text-lg font-light mb-16 max-w-lg mx-auto leading-relaxed font-sans">
              Join our mailing list for exclusive access to new arrivals, private sales, and seasonal fashion editorials.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-xl mx-auto border border-black/10 focus-within:border-black transition-colors duration-500">
              <Input
                type="email"
                placeholder="ENTER YOUR EMAIL"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 rounded-none border-none bg-transparent px-8 text-[10px] uppercase tracking-[0.3em] focus-visible:ring-0 flex-1"
              />
              <Button
                type="submit"
                className="h-16 px-12 rounded-none uppercase tracking-[0.3em] text-[10px] font-bold transition-all bg-black text-white hover:bg-neutral-800 shrink-0"
              >
                Join Now
              </Button>
            </form>

            <p className="mt-8 text-[9px] uppercase tracking-[0.4em] text-neutral-300 font-medium">
              Privacy guaranteed. Unsubscribe at any time.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
