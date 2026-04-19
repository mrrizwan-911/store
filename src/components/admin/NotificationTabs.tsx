"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { label: "All Logs", value: "all" },
  { label: "Orders", value: "orders" },
  { label: "Abandoned Carts", value: "cart" },
  { label: "Quotations", value: "quotations" },
  { label: "Failed", value: "failed" },
];

export function NotificationTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("filter") || "all";

  const handleTabChange = (value: string | null) => {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("filter");
    } else {
      params.set("filter", value);
    }
    router.push(`/admin/notifications?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList variant="line" className="justify-start border-b border-border w-full rounded-none h-12 gap-6 bg-transparent">
        {TABS.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="text-sm font-medium rounded-none px-2 data-active:after:bg-black"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
