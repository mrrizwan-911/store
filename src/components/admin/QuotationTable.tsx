"use client";

import Link from "next/link";
import { Eye, Building2, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuotationStatus } from "@prisma/client";

interface QuotationItem {
  productId: string;
  quantity: number;
  notes?: string;
}

export interface Quotation {
  id: string;
  name: string;
  email: string;
  company: string | null;
  items: any; // Json: QuotationItem[]
  status: QuotationStatus;
  createdAt: Date | string;
  expiresAt: Date | string | null;
}

interface QuotationTableProps {
  quotations: Quotation[];
}

export function QuotationTable({ quotations }: QuotationTableProps) {
  const getStatusStyles = (status: QuotationStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-white text-black border-black";
      case "SENT":
        return "bg-black text-white border-black";
      case "ACCEPTED":
        return "bg-[#E5E5E5] text-black border-[#E5E5E5]";
      case "REJECTED":
        return "bg-transparent text-[#737373] border-[#E5E5E5] line-through opacity-70";
      case "CONVERTED":
        return "bg-black text-[#E8D5B0] border-black"; // Black and Gold for premium success
      case "EXPIRED":
        return "bg-transparent text-[#A3A3A3] border-[#E5E5E5] opacity-50";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getItemCount = (items: any) => {
    if (Array.isArray(items)) return items.length;
    return 0;
  };

  return (
    <div className="w-full bg-white border border-[#E5E5E5]">
      <Table>
        <TableHeader className="bg-[#FAFAFA]">
          <TableRow className="border-[#E5E5E5] hover:bg-transparent">
            <TableHead className="font-display font-bold text-black py-4 pl-6 w-20">#</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Customer</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Company</TableHead>
            <TableHead className="font-display font-bold text-black py-4 text-center">Items</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Submitted</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Expires</TableHead>
            <TableHead className="font-display font-bold text-black py-4">Status</TableHead>
            <TableHead className="font-display font-bold text-black py-4 text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-[#737373] font-body italic">
                No quotations found.
              </TableCell>
            </TableRow>
          ) : (
            quotations.map((q) => {
              const isExpired = q.status === "EXPIRED";
              return (
                <TableRow
                  key={q.id}
                  data-testid="quotation-row"
                  className={cn(
                    "border-[#E5E5E5] hover:bg-[#FAFAFA]/50 transition-colors",
                    isExpired && "bg-[#FAFAFA]/30"
                  )}
                >
                  <TableCell className={cn("py-4 pl-6 text-xs font-mono text-[#737373]", isExpired && "opacity-50")}>
                    {q.id.slice(-6).toUpperCase()}
                  </TableCell>
                  <TableCell className={cn("py-4", isExpired && "opacity-50")}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center rounded-none shrink-0">
                        <User className="w-3.5 h-3.5 text-[#737373]" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-body font-bold text-sm text-black">{q.name}</span>
                        <span className="font-body text-xs text-[#737373]">{q.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={cn("py-4", isExpired && "opacity-50")}>
                    {q.company ? (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-[#A3A3A3]" />
                        <span className="font-body text-sm text-black">{q.company}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-[#A3A3A3] italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className={cn("py-4 text-center", isExpired && "opacity-50")}>
                    <Badge variant="outline" className="rounded-none border-[#E5E5E5] text-black font-body font-normal">
                      {getItemCount(q.items)}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn("py-4 text-sm font-body text-black", isExpired && "opacity-50")}>
                    {new Date(q.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={cn("py-4 text-sm font-body text-black", isExpired && "opacity-50")}>
                    {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-none px-2 py-0 text-[10px] font-bold tracking-widest uppercase border",
                        getStatusStyles(q.status)
                      )}
                    >
                      {q.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <Link
                      href={`/admin/quotations/${q.id}`}
                      data-testid="view-detail-btn"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "rounded-none border-[#E5E5E5] h-8 px-3 hover:bg-white hover:border-black transition-all"
                      )}
                    >
                      <Eye className="w-3.5 h-3.5 mr-2" />
                      <span className="text-[11px] font-bold uppercase tracking-wider font-body">View</span>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
