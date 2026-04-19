"use client";

import { useState } from "react";
import { Quotation, QuotationStatus, User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  FileDown,
  PlusCircle,
  AlertCircle
} from "lucide-react";

interface QuotationItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface QuotationDetailProps {
  quotation: Quotation & { user?: User | null };
}

export function QuotationDetail({ quotation }: QuotationDetailProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<QuotationStatus>(quotation.status);
  const [aiDraft, setAiDraft] = useState(quotation.aiDraft || "");

  const items = quotation.items as unknown as QuotationItem[];

  const handleUpdate = async (updates: Partial<Quotation>) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update quotation");

      toast.success("Quotation updated successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update quotation");
    } finally {
      setIsUpdating(false);
    }
  };

  const showNotImplemented = () => {
    toast.info("Feature not implemented yet (501)");
  };

  const handleExtendExpiry = () => {
    const currentExpiry = quotation.expiresAt ? new Date(quotation.expiresAt) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + 7 * 24 * 60 * 60 * 1000);
    handleUpdate({ expiresAt: newExpiry });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-1">
      {/* Left Panel: Customer & Items */}
      <div className="space-y-8">
        <Card className="rounded-none border-neutral-200 shadow-none">
          <CardHeader className="bg-[#FAFAFA] border-b border-neutral-100">
            <CardTitle className="font-display text-lg uppercase tracking-wider flex items-center gap-2">
              <UserIcon className="w-5 h-5" /> Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 font-body">
            <div className="flex items-center gap-3 text-neutral-600">
              <UserIcon className="w-4 h-4" />
              <span className="text-black font-semibold">{quotation.name}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-600">
              <Mail className="w-4 h-4" />
              <span>{quotation.email}</span>
            </div>
            {quotation.phone && (
              <div className="flex items-center gap-3 text-neutral-600">
                <Phone className="w-4 h-4" />
                <span>{quotation.phone}</span>
              </div>
            )}
            {quotation.company && (
              <div className="flex items-center gap-3 text-neutral-600">
                <Building2 className="w-4 h-4" />
                <span>{quotation.company}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border-neutral-200 shadow-none">
          <CardHeader className="bg-[#FAFAFA] border-b border-neutral-100">
            <CardTitle className="font-display text-lg uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-5 h-5" /> Requested Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                  <TableHead className="font-display uppercase text-xs tracking-widest px-6">Product</TableHead>
                  <TableHead className="font-display uppercase text-xs tracking-widest text-center">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx} className="border-b border-neutral-100 font-body">
                    <TableCell className="px-6 py-4">
                      <div className="font-medium text-black">{item.name}</div>
                      {item.notes && (
                        <div className="text-xs text-neutral-500 mt-1 italic">{item.notes}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-[#E8D5B0] hover:bg-[#d4c19d] text-black rounded-none uppercase font-display tracking-widest py-6"
          onClick={showNotImplemented}
        >
          <CheckCircle2 className="w-4 h-4 mr-2" /> Convert to Order
        </Button>
      </div>

      {/* Center Panel: AI Draft & Status */}
      <div className="space-y-8">
        <Card className="rounded-none border-neutral-200 shadow-none">
          <CardHeader className="bg-[#FAFAFA] border-b border-neutral-100">
            <CardTitle className="font-display text-lg uppercase tracking-wider flex items-center gap-2">
              AI Quotation Draft
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <Textarea
              value={aiDraft}
              onChange={(e) => setAiDraft(e.target.value)}
              className="min-h-[300px] rounded-none border-neutral-200 font-body text-sm leading-relaxed"
              placeholder="AI generated draft will appear here..."
            />
            <Button
              className="w-full bg-black hover:bg-neutral-800 text-white rounded-none uppercase font-display tracking-widest"
              onClick={() => handleUpdate({ aiDraft })}
              disabled={isUpdating}
            >
              Update AI Draft
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-none border-neutral-200 shadow-none">
          <CardHeader className="bg-[#FAFAFA] border-b border-neutral-100">
            <CardTitle className="font-display text-lg uppercase tracking-wider flex items-center gap-2">
              Management
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-display uppercase tracking-widest text-neutral-500">Status</label>
              <div className="flex gap-2">
                <Select value={status} onValueChange={(val) => setStatus(val as QuotationStatus)}>
                  <SelectTrigger className="rounded-none border-neutral-200 font-body">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none font-body">
                    <SelectItem value="PENDING">Pending Review</SelectItem>
                    <SelectItem value="SENT">Sent to Customer</SelectItem>
                    <SelectItem value="ACCEPTED">Accepted</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="CONVERTED">Converted to Order</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="rounded-none border-black hover:bg-neutral-50"
                  onClick={() => handleUpdate({ status })}
                  disabled={isUpdating}
                >
                  Update
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-display uppercase tracking-widest text-neutral-500">Expiry Date</label>
              <div className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-100">
                <div className="flex items-center gap-2 font-body text-sm">
                  <Clock className="w-4 h-4 text-neutral-400" />
                  {quotation.expiresAt
                    ? new Date(quotation.expiresAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : "Not set"}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs uppercase tracking-widest font-display hover:bg-transparent hover:underline p-0 h-auto"
                  onClick={handleExtendExpiry}
                  disabled={isUpdating}
                >
                  <PlusCircle className="w-3 h-3 mr-1" /> Extend 7 Days
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: PDF Preview & Actions */}
      <div className="space-y-8">
        <Card className="rounded-none border-neutral-200 shadow-none h-full flex flex-col">
          <CardHeader className="bg-[#FAFAFA] border-b border-neutral-100">
            <CardTitle className="font-display text-lg uppercase tracking-wider flex items-center gap-2">
              PDF Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex-grow space-y-6">
            <div className="aspect-[3/4] w-full bg-neutral-100 flex items-center justify-center border border-dashed border-neutral-300 relative overflow-hidden">
              {quotation.pdfUrl ? (
                <iframe
                  src={quotation.pdfUrl}
                  className="w-full h-full border-none"
                  title="Quotation PDF Preview"
                />
              ) : (
                <div className="text-center p-6 space-y-2">
                  <AlertCircle className="w-8 h-8 text-neutral-300 mx-auto" />
                  <p className="font-body text-xs text-neutral-400 uppercase tracking-widest">
                    No PDF Generated Yet
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-black hover:bg-neutral-800 text-white rounded-none uppercase font-display tracking-widest"
                onClick={showNotImplemented}
              >
                Generate PDF
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-none border-black uppercase font-display tracking-widest"
                disabled={!quotation.pdfUrl}
                onClick={showNotImplemented}
              >
                <FileDown className="w-4 h-4 mr-2" /> Download PDF
              </Button>
              <Button
                className="w-full bg-[#E8D5B0] hover:bg-[#d4c19d] text-black rounded-none uppercase font-display tracking-widest"
                onClick={showNotImplemented}
              >
                <Send className="w-4 h-4 mr-2" /> Send Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
