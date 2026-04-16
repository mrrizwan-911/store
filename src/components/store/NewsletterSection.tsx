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
    <section className="py-24 bg-white border-t border-border">
      <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold mb-6 block">
          Stay Connected
        </span>

        {isSubmitted ? (
          <div className="animate-in fade-in zoom-in duration-500">
            <CheckCircle2 className="w-16 h-16 text-black mx-auto mb-6" />
            <h2 className="font-display text-3xl md:text-4xl font-medium uppercase mb-4 tracking-tight">
              You&apos;re on the list
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              Thank you for joining. Check your inbox soon for your exclusive 10% discount code.
            </p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-4xl md:text-6xl font-medium uppercase mb-8 tracking-tighter">
              Get 10% off <br /> your first order
            </h2>
            <p className="text-neutral-500 text-base md:text-lg font-light mb-12 max-w-lg mx-auto leading-relaxed">
              Join our mailing list for exclusive access to new arrivals, private sales, and fashion editorials.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="YOUR EMAIL ADDRESS"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 rounded-none border-border bg-transparent px-6 text-xs uppercase tracking-widest focus-visible:ring-black"
              />
              <Button
                type="submit"
                className="h-14 px-8 rounded-none uppercase tracking-[0.2em] text-xs font-bold transition-all"
              >
                Subscribe
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            <p className="mt-6 text-[10px] uppercase tracking-widest text-neutral-300">
              No spam. Unsubscribe at any time.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
