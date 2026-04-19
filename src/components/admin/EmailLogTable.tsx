"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import { RotateCcw } from "lucide-react";

interface EmailLog {
  id: string;
  email: string;
  type: string;
  status: string;
  retryCount: number;
  sentAt: string | Date;
}

interface EmailLogTableProps {
  logs: EmailLog[];
}

const TYPE_MAP: Record<string, string> = {
  order_confirm: "Order Confirmation",
  order_shipped: "Order Shipped",
  order_delivered: "Order Delivered",
  otp_verification: "OTP Verification",
  abandoned_cart: "Abandoned Cart",
  quotation_sent: "Quotation Sent",
  quotation_followup: "Quotation Follow-up",
};

export function EmailLogTable({ logs }: EmailLogTableProps) {
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const handleRetry = async (id: string) => {
    try {
      setRetryingIds((prev) => new Set(prev).add(id));
      logger.info(`Retrying email notification: ${id}`);

      const response = await fetch(`/api/admin/notifications/${id}/retry`, {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Retry initiated successfully");
        // Note: In a real app, we might want to refresh the page or update the local state
      } else {
        throw new Error(result.error || "Failed to retry notification");
      }
    } catch (error) {
      logger.error(`Error retrying notification ${id}`, error);
      toast.error(error instanceof Error ? error.message : "Failed to retry notification");
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  };

  const getHumanFriendlyType = (type: string) => {
    return TYPE_MAP[type] || type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="border border-border bg-white rounded-none">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-b border-border">
            <TableHead className="font-display font-semibold text-black py-4">Type</TableHead>
            <TableHead className="font-display font-semibold text-black py-4">Recipient</TableHead>
            <TableHead className="font-display font-semibold text-black py-4">Status</TableHead>
            <TableHead className="font-display font-semibold text-black py-4">Retries</TableHead>
            <TableHead className="font-display font-semibold text-black py-4">Date</TableHead>
            <TableHead className="font-display font-semibold text-black py-4 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center font-body text-muted-foreground">
                No notification logs found.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow
                key={log.id}
                data-testid="notification-row"
                className={`group border-b border-border hover:bg-muted/20 transition-colors ${
                  log.status === "failed" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-transparent"
                }`}
              >
                <TableCell className="font-medium font-body py-4">
                  {getHumanFriendlyType(log.type)}
                </TableCell>
                <TableCell className="font-body py-4">{log.email}</TableCell>
                <TableCell className="py-4">
                  <Badge
                    variant={log.status === "sent" ? "default" : "destructive"}
                    className={`rounded-none px-2 uppercase text-[10px] tracking-wider font-bold ${
                      log.status === "sent" ? "bg-green-600 hover:bg-green-700" : ""
                    }`}
                  >
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-body py-4 text-muted-foreground">
                  {log.retryCount}
                </TableCell>
                <TableCell className="font-body py-4 text-muted-foreground">
                  {formatDate(log.sentAt)}
                </TableCell>
                <TableCell className="py-4 text-right">
                  {log.status === "failed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(log.id)}
                      disabled={retryingIds.has(log.id)}
                      className="h-8 rounded-none border-black text-black hover:bg-black hover:text-white transition-all font-body text-xs uppercase tracking-tight"
                    >
                      <RotateCcw className={`mr-1.5 size-3 ${retryingIds.has(log.id) ? "animate-spin" : ""}`} />
                      {retryingIds.has(log.id) ? "Retrying..." : "Retry"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
