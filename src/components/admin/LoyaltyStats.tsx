import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoyaltyStatsProps {
  totalMembers: number;
  totalIssued: number;
  totalRedeemed: number;
}

const LoyaltyStats: React.FC<LoyaltyStatsProps> = ({
  totalMembers,
  totalIssued,
  totalRedeemed,
}) => {
  const stats = [
    {
      label: 'Total Members',
      value: totalMembers.toLocaleString(),
    },
    {
      label: 'Points Issued (All Time)',
      value: totalIssued.toLocaleString(),
    },
    {
      label: 'Points Redeemed',
      value: totalRedeemed.toLocaleString(),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {stats.map((stat) => (
        <Card
          key={stat.label}
          className="rounded-none border-[#E5E5E5] bg-[#FAFAFA] shadow-none"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-[0.2em] text-[#888888] font-body font-semibold">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-display text-[#000000] tracking-tight">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default LoyaltyStats;
