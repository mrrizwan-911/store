import React from "react";
import { Metadata } from "next";
import { QuotationForm } from "@/components/store/QuotationForm";

export const metadata: Metadata = {
  title: "Request a Quotation | B2B Portal",
  description: "Get custom pricing for bulk orders, corporate gifting, and wholesale apparel.",
};

export default function QuotationPage() {
  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <section className="py-16 md:py-24 border-b border-gray-100 mb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
              Corporate & Bulk <br /> Quotation Portal
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Elevate your business with our premium apparel. Whether you're looking for corporate uniforms,
              wholesale inventory, or custom-branded merchandise, our B2B team is here to assist with
              volume-based pricing and tailored logistics.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="container mx-auto px-4">
        <QuotationForm />
      </section>
    </main>
  );
}
