'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { logger } from '@/lib/utils/logger'

const adjustmentSchema = z.object({
  points: z.coerce.number().int().refine((n) => n !== 0, 'Points must be non-zero'),
  reason: z.string().min(1, 'Reason is required'),
})

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>

interface AdjustPointsDialogProps {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AdjustPointsDialog({
  userId,
  userName,
  open,
  onOpenChange,
  onSuccess,
}: AdjustPointsDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema) as any,
    defaultValues: {
      points: 0,
      reason: '',
    },
  })

  const onSubmit = async (data: AdjustmentFormValues) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/loyalty/${userId}/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to adjust points')
      }

      toast.success(`Successfully adjusted ${data.points} points for ${userName}`)
      reset()
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      logger.error('Error adjusting loyalty points', { error, userId })
      toast.error(error.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="adjust-points-modal" className="sm:max-w-[425px] rounded-none border-[#E5E5E5] bg-white">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">Adjust Points</DialogTitle>
          <DialogDescription className="font-body text-[#737373]">
            Manually add or subtract loyalty points for {userName}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="points" className="font-body font-medium text-sm">
              Points (Negative to subtract)
            </Label>
            <Input
              id="points"
              data-testid="points-input"
              type="number"
              placeholder="e.g. 100 or -50"
              className="rounded-none border-[#E5E5E5] focus-visible:ring-black font-body"
              {...register('points')}
            />
            {errors.points && (
              <p className="text-xs text-red-500 font-body">{errors.points.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="font-body font-medium text-sm">
              Reason
            </Label>
            <Textarea
              id="reason"
              data-testid="reason-input"
              placeholder="Reason for adjustment"
              className="rounded-none border-[#E5E5E5] focus-visible:ring-black min-h-[100px] font-body"
              {...register('reason')}
            />
            {errors.reason && (
              <p className="text-xs text-red-500 font-body">{errors.reason.message}</p>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-none border-[#E5E5E5] font-body uppercase text-[11px] font-bold tracking-widest"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-testid="adjust-submit-btn"
              className="rounded-none bg-black text-white hover:bg-[#262626] font-body uppercase text-[11px] font-bold tracking-widest"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
