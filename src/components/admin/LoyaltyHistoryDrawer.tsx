'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface LoyaltyEvent {
  id: string
  points: number
  reason: string
  createdAt: string | Date
}

interface LoyaltyHistoryDrawerProps {
  userName: string
  history: LoyaltyEvent[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoyaltyHistoryDrawer({
  userName,
  history,
  open,
  onOpenChange,
}: LoyaltyHistoryDrawerProps) {
  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-l border-[#E5E5E5] bg-white p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-[#E5E5E5] space-y-1">
            <SheetTitle className="font-serif text-xl font-bold">Loyalty History</SheetTitle>
            <SheetDescription className="font-sans text-[#737373]">
              Points activity for {userName}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            {sortedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-[#737373] font-sans italic">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedHistory.map((event, index) => (
                  <div key={event.id} className="relative pl-6 pb-6 border-l border-[#E5E5E5] last:pb-0">
                    {/* Dot */}
                    <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full bg-black" />

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-start">
                        <span className="font-sans text-xs text-[#737373] uppercase tracking-wider">
                          {format(new Date(event.createdAt), 'MMM dd, yyyy • HH:mm')}
                        </span>
                        <span
                          className={cn(
                            "font-sans font-bold text-sm",
                            event.points > 0 ? "text-green-600" : "text-red-600"
                          )}
                        >
                          {event.points > 0 ? `+${event.points}` : event.points} pts
                        </span>
                      </div>
                      <p className="font-sans text-sm text-black font-medium leading-relaxed">
                        {event.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-6 border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <p className="text-[11px] text-[#737373] font-sans uppercase tracking-widest text-center">
              Total Events: {history.length}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
