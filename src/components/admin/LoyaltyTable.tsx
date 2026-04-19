'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { History, PlusCircle, User } from 'lucide-react'
import { AdjustPointsDialog } from './AdjustPointsDialog'
import { LoyaltyHistoryDrawer } from './LoyaltyHistoryDrawer'
import { cn } from '@/lib/utils'

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'

export interface LoyaltyEvent {
  id: string
  points: number
  reason: string
  createdAt: string | Date
}

export interface LoyaltyAccount {
  id: string
  userId: string
  points: number
  tier: LoyaltyTier
  totalEarned: number
  history: LoyaltyEvent[]
  user: {
    name: string
    email: string
  }
}

interface LoyaltyTableProps {
  accounts: LoyaltyAccount[]
  onRefresh?: () => void
}

export function LoyaltyTable({ accounts, onRefresh }: LoyaltyTableProps) {
  const router = useRouter()
  const [selectedAccount, setSelectedAccount] = useState<LoyaltyAccount | null>(null)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh()
    } else {
      router.refresh()
    }
  }

  const handleOpenAdjust = (account: LoyaltyAccount) => {
    setSelectedAccount(account)
    setIsAdjustDialogOpen(true)
  }

  const handleOpenHistory = (account: LoyaltyAccount) => {
    setSelectedAccount(account)
    setIsHistoryDrawerOpen(true)
  }

  const getTierColor = (tier: LoyaltyTier) => {
    switch (tier) {
      case 'BRONZE':
        return 'bg-amber-700/10 text-amber-700 border-amber-700/20'
      case 'SILVER':
        return 'bg-slate-400/10 text-slate-600 border-slate-400/20'
      case 'GOLD':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
      case 'PLATINUM':
        return 'bg-indigo-600/10 text-indigo-700 border-indigo-600/20'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="w-full bg-white border border-[#E5E5E5]">
      <Table>
        <TableHeader className="bg-[#FAFAFA]">
          <TableRow className="border-[#E5E5E5] hover:bg-transparent">
            <TableHead className="font-display font-bold text-black py-4 pl-6">Customer</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Tier</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Balance</TableHead>
            <TableHead className="font-display font-bold text-black py-4 text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-[#737373] font-body italic">
                No loyalty accounts found.
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow key={account.id} data-testid="loyalty-row" className="border-[#E5E5E5] hover:bg-[#FAFAFA]/50 transition-colors">
                <TableCell className="py-4 pl-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center rounded-none shrink-0">
                      <User className="w-4 h-4 text-[#737373]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-body font-bold text-sm text-black">{account.user.name}</span>
                      <span className="font-body text-xs text-[#737373]">{account.user.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant="outline"
                    className={cn(
                      "rounded-none px-2 py-0 text-[10px] font-bold tracking-widest uppercase border",
                      getTierColor(account.tier)
                    )}
                  >
                    {account.tier}
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="flex flex-col">
                    <span className="font-body font-bold text-sm text-black">{account.points.toLocaleString()} pts</span>
                    <span className="font-body text-[10px] text-[#737373] uppercase tracking-tighter">
                      LTV: {account.totalEarned.toLocaleString()} total
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-right pr-6">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="view-history-btn"
                      className="rounded-none border-[#E5E5E5] h-8 px-3 hover:bg-white hover:border-black transition-all"
                      onClick={() => handleOpenHistory(account)}
                    >
                      <History className="w-3.5 h-3.5 mr-2" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-body">History</span>
                    </Button>
                    <Button
                      size="sm"
                      data-testid="adjust-points-btn"
                      className="rounded-none bg-black text-white h-8 px-3 hover:bg-[#262626] transition-all"
                      onClick={() => handleOpenAdjust(account)}
                    >
                      <PlusCircle className="w-3.5 h-3.5 mr-2" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-body">Adjust</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedAccount && (
        <>
          <AdjustPointsDialog
            userId={selectedAccount.userId}
            userName={selectedAccount.user.name}
            open={isAdjustDialogOpen}
            onOpenChange={setIsAdjustDialogOpen}
            onSuccess={handleRefresh}
          />
          <LoyaltyHistoryDrawer
            userName={selectedAccount.user.name}
            history={selectedAccount.history}
            open={isHistoryDrawerOpen}
            onOpenChange={setIsHistoryDrawerOpen}
          />
        </>
      )}
    </div>
  )
}
