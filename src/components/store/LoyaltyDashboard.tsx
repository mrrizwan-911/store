'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Award, ShoppingBag, Star, Share2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface LoyaltyData {
  points: number
  tier: string
  totalEarned: number
  nextTier: string
  pointsToNextTier: number
  progressPct: number
  history: Array<{ id: string; points: number; reason: string; createdAt: string }>
}

const tierColors: Record<string, string> = {
  BRONZE: 'bg-[#8c7355]',
  SILVER: 'bg-[#C0C0C0]',
  GOLD: 'bg-[#E8D5B0]',
  PLATINUM: 'bg-[#E5E4E2]',
}

const tierTextColors: Record<string, string> = {
  BRONZE: 'text-[#8c7355]',
  SILVER: 'text-[#C0C0C0]',
  GOLD: 'text-[#E8D5B0]',
  PLATINUM: 'text-[#E5E4E2]',
}

export function LoyaltyDashboard() {
  const [data, setData] = useState<LoyaltyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeemPoints, setRedeemPoints] = useState<number[]>([100])
  const [redeeming, setRedeeming] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/account/loyalty')
        const json = await res.json()
        if (json.success) {
          setData(json.data)
          // Default slider value ensuring it's valid
          const maxRedeem = Math.min(json.data.points, 500)
          setRedeemPoints([Math.max(100, Math.floor(maxRedeem / 100) * 100)])
        }
      } catch (err) {
        console.error('Failed to fetch loyalty data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleRedeem = async () => {
    setRedeeming(true)
    try {
      const res = await fetch('/api/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: redeemPoints[0], orderId: 'manual_redeem' })
        // Note: In real flow, this usually applies to a cart/checkout.
        // The API spec requires an orderId. We pass manual_redeem for testing standalone.
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Successfully redeemed ${redeemPoints[0]} points! (Simulated)`)
        setData((prev) => prev ? { ...prev, points: prev.points - redeemPoints[0] } : prev)
      } else {
        toast.error(json.error || 'Failed to redeem points')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setRedeeming(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#F5F5F5]">Loading loyalty data...</div>
  }

  if (!data) {
    return <div className="p-8 text-center text-red-500">Error loading loyalty data. Please try again.</div>
  }

  const tierBadgeColor = tierColors[data.tier] || 'bg-gray-500'
  const tierTextColor = tierTextColors[data.tier] || 'text-gray-500'

  const maxRedeem = Math.min(data.points, 500)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 bg-[#0A0A0A] min-h-screen text-[#F5F5F5]">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center ${tierBadgeColor} text-[#0A0A0A]`}>
          <Award size={48} />
        </div>
        <div>
          <h1 className="text-3xl font-serif">Your Loyalty Status</h1>
          <p className={`text-lg font-semibold ${tierTextColor}`}>{data.tier} TIER</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-[#E8D5B0]">Points Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{data.points} pts</p>
            <p className="text-[#888] mt-2">= PKR {data.points} in store credit</p>
          </CardContent>
        </Card>

        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-[#E8D5B0]">Progress to {data.nextTier}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={data.progressPct} className="h-3 bg-[#222] [&_[data-slot=progress-indicator]]:bg-[#E8D5B0]" />
            <p className="text-[#888] mt-4">{data.pointsToNextTier} points to {data.nextTier}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-serif text-[#E8D5B0]">How to Earn</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#141414] border-[#222] flex items-center p-4">
          <ShoppingBag className="text-[#E8D5B0] mr-4" size={32} />
          <div>
            <p className="font-semibold text-white">Shopping</p>
            <p className="text-sm text-[#888]">1 pt per PKR 100</p>
          </div>
        </Card>
        <Card className="bg-[#141414] border-[#222] flex items-center p-4">
          <Star className="text-[#E8D5B0] mr-4" size={32} />
          <div>
            <p className="font-semibold text-white">Reviews</p>
            <p className="text-sm text-[#888]">+5 points</p>
          </div>
        </Card>
        <Card className="bg-[#141414] border-[#222] flex items-center p-4">
          <Share2 className="text-[#E8D5B0] mr-4" size={32} />
          <div>
            <p className="font-semibold text-white">Referrals</p>
            <p className="text-sm text-[#888]">+50 points</p>
          </div>
        </Card>
      </div>

      <Card className="bg-[#141414] border-[#222]">
        <CardHeader>
          <CardTitle className="text-[#E8D5B0]">Redeem Points</CardTitle>
          <CardDescription className="text-[#888]">Redeem up to 500 points per order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.points >= 100 ? (
            <>
              <Slider
                min={100}
                max={Math.floor(maxRedeem / 100) * 100}
                step={100}
                value={redeemPoints}
                onValueChange={(val) => setRedeemPoints(val as number[])}
                className="my-6"
              />
              <p className="text-center text-lg">{redeemPoints[0]} pts = PKR {redeemPoints[0]} off</p>
              <div className="flex justify-center">
                <Button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="bg-[#E8D5B0] text-[#0A0A0A] hover:bg-[#d4c19d]"
                >
                  Apply to Cart
                </Button>
              </div>
            </>
          ) : (
            <p className="text-[#888] text-center">You need at least 100 points to redeem.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#141414] border-[#222]">
        <CardHeader>
          <CardTitle className="text-[#E8D5B0]">History</CardTitle>
        </CardHeader>
        <CardContent>
          {data.history.length === 0 ? (
            <p className="text-[#888]">No history yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#222] hover:bg-transparent">
                  <TableHead className="text-[#888]">Date</TableHead>
                  <TableHead className="text-[#888]">Reason</TableHead>
                  <TableHead className="text-[#888] text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((event) => (
                  <TableRow key={event.id} className="border-[#222] hover:bg-[#1A1A1A]">
                    <TableCell>{new Date(event.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{event.reason}</TableCell>
                    <TableCell className={`text-right font-semibold ${event.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {event.points > 0 ? `+${event.points}` : event.points}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
