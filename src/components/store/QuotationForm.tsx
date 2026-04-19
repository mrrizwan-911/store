"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quotationSchema, QuotationInput } from "@/lib/validations/quotation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { Plus, Trash2, Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: string;
  name: string;
  basePrice: number;
}

export const QuotationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<QuotationInput>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      items: [{ productId: "", quantity: 10, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Fetch initial products or search results
  const fetchProducts = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/products?search=${query}&limit=10`);
      const result = await res.json();
      if (result.success) {
        setSearchResults(result.data.products);
      }
    } catch (error) {
      logger.error("Failed to fetch products for quotation form", error as Error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts("");
  }, [fetchProducts]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
    const timer = setTimeout(() => {
      fetchProducts(val);
    }, 500);
    return () => clearTimeout(timer);
  };

  const onSubmit = async (data: QuotationInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        setIsSuccess(true);
        toast.success("Quotation request submitted successfully!");
        reset();
      } else {
        toast.error(result.error || "Failed to submit request");
      }
    } catch (error) {
      logger.error("Quotation submission error", error as Error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500 font-body">
        <div className="size-16 bg-black text-white rounded-full flex items-center justify-center mb-6">
          <Search className="size-8" />
        </div>
        <h2 className="text-3xl font-display mb-4">Request Received!</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-8">
          Thank you for your interest. Our B2B team will review your request and get back to you with a formal quotation within 24 hours. Check your email for confirmation.
        </p>
        <Button
          variant="outline"
          onClick={() => setIsSuccess(false)}
          className="rounded-none border-black hover:bg-black hover:text-white transition-colors font-body"
        >
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-body">
      <div className="lg:col-span-2">
        <form data-testid="quotation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+92 300 1234567"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Company Pvt Ltd"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("company")}
              />
              {errors.company && (
                <p className="text-sm text-red-500">{errors.company.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display">Requested Products</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", quantity: 10, notes: "" })}
                className="rounded-none border-black hover:bg-black hover:text-white transition-all flex items-center gap-2 font-body"
              >
                <Plus className="size-4" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="rounded-none border-gray-100 shadow-none bg-[#FAFAFA]">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-7 space-y-2">
                        <Label>Select Product *</Label>
                        <Select
                          onValueChange={(val) => val && setValue(`items.${index}.productId`, val)}
                          defaultValue={field.productId}
                        >
                          <SelectTrigger className="rounded-none bg-white border-gray-200 font-body">
                            <SelectValue placeholder="Search or select a product" />
                          </SelectTrigger>
                          <SelectContent className="rounded-none font-body">
                            <div className="flex items-center px-2 py-2 border-b border-gray-100">
                              <Search className="size-4 mr-2 text-muted-foreground" />
                              <input
                                placeholder="Search products..."
                                className="w-full text-sm outline-none bg-transparent font-body"
                                onChange={(e) => handleSearch(e.target.value)}
                              />
                            </div>
                            {isSearching ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="size-4 animate-spin" />
                              </div>
                            ) : searchResults.length > 0 ? (
                              searchResults.map((p) => (
                                <SelectItem key={p.id} value={p.id} className="rounded-none font-body">
                                  {p.name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="py-2 px-2 text-sm text-muted-foreground text-center">
                                No products found
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        {errors.items?.[index]?.productId && (
                          <p className="text-xs text-red-500 font-body">{errors.items[index]?.productId?.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <Label>Quantity (Min 10) *</Label>
                        <Input
                          type="number"
                          min={10}
                          className="rounded-none bg-white border-gray-200 font-body"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-xs text-red-500 font-body">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 flex items-end justify-end">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-none"
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Notes (Optional)</Label>
                      <Textarea
                        placeholder="Size requirements, color preferences, or custom branding needs..."
                        className="rounded-none bg-white border-gray-200 min-h-[80px] font-body"
                        {...register(`items.${index}.notes`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errors.items?.root && (
              <p className="text-sm text-red-500 font-body">{errors.items.root.message}</p>
            )}
          </div>

          <Button
            type="submit"
            data-testid="quotation-submit-btn"
            disabled={isSubmitting}
            className="w-full h-12 rounded-none bg-black text-white hover:bg-zinc-800 transition-all font-medium text-lg font-body"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" /> Processing...
              </span>
            ) : (
              "Submit Quote Request"
            )}
          </Button>
        </form>
      </div>

      <div className="space-y-8 font-body">
        <div className="p-8 border border-gray-100 bg-[#FAFAFA] space-y-6">
          <h3 className="text-2xl font-display">Why Choose B2B?</h3>
          <ul className="space-y-4 font-body">
            <li className="flex gap-3">
              <div className="size-1.5 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-medium">Volume Discounts</p>
                <p className="text-sm text-muted-foreground">Significant savings for orders over 50 units per item.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="size-1.5 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-medium">Priority Processing</p>
                <p className="text-sm text-muted-foreground">Response to quotations within 24 business hours.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="size-1.5 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-medium">Custom Packaging</p>
                <p className="text-sm text-muted-foreground">Branded boxes and custom tagging available for wholesale.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="size-1.5 rounded-full bg-black mt-2 shrink-0" />
              <div>
                <p className="font-medium">Flexible Logistics</p>
                <p className="text-sm text-muted-foreground">Door-to-door delivery across Pakistan with tracking.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="p-8 border border-gray-100 bg-white space-y-4">
          <h4 className="font-serif text-lg">Need Help?</h4>
          <p className="text-sm text-muted-foreground">
            Have a complex request or want to talk to our corporate sales representative directly?
          </p>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-none border-black hover:bg-black hover:text-white transition-all font-body h-10"
            )}
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
