'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'

interface ReviewFormProps {
  onSuccess: (newReview: any) => void
  onCancel: () => void
}

export default function ReviewForm({ onSuccess, onCancel }: ReviewFormProps) {
  const { slug } = useParams()
  const { accessToken } = useSelector((state: RootState) => state.auth)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    if (body.length < 10) {
      toast.error('Review must be at least 10 characters')
      return
    }

    if (!accessToken) {
      toast.error('You must be logged in to submit a review')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/products/${slug}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ rating, title, body })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit review')
      }

      toast.success('Review submitted successfully!')
      onSuccess(result.data)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('An unexpected error occurred')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-[#FAFAFA] p-8 border border-[#E5E5E5] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-display uppercase tracking-tight">Write a Review</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-[10px] uppercase tracking-widest font-bold underline hover:text-neutral-500"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        <Label className="text-[10px] uppercase font-bold tracking-widest text-black">
          Your Rating
        </Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} stars`}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-6 h-6 transition-colors",
                  star <= (hoveredRating || rating)
                    ? "text-primary fill-primary"
                    : "text-neutral-200 fill-neutral-200"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title" className="text-[10px] uppercase font-bold tracking-widest text-black">
          Review Title
        </Label>
        <Input
          id="title"
          name="title"
          placeholder="Summarize your experience"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 border-[#E5E5E5] rounded-none focus:border-black focus:ring-0 outline-none bg-white text-black h-12"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body" className="text-[10px] uppercase font-bold tracking-widest text-black">
          Review Content
        </Label>
        <Textarea
          id="body"
          name="body"
          rows={5}
          placeholder="What did you like or dislike?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full p-4 border-[#E5E5E5] rounded-none focus:border-black focus:ring-0 outline-none bg-white text-black min-h-[120px]"
        />
        <p className="text-[10px] text-neutral-400">Min. 10 characters</p>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black hover:bg-[#262626] text-white py-6 uppercase tracking-widest font-bold rounded-none transition-colors h-14"
      >
        {isLoading ? 'Submitting...' : 'Submit Review'}
      </Button>
    </form>
  )
}
