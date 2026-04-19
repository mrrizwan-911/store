"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const [storeInfo, setStoreInfo] = useState({
    name: "Antigravity Luxury Store",
    email: "admin@antigravity.com",
    whatsapp: "+92 300 1234567"
  })

  const [notifications, setNotifications] = useState({
    orderConfirmation: true,
    abandonedCart: true,
    shipped: false
  })

  const handleSaveStoreInfo = () => {
    // Stubbed action
    toast.success("Settings updated (stubbed)")
  }

  const handleSaveToggles = () => {
    // Stubbed action
    toast.success("Settings updated (stubbed)")
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-black pb-4">
        <h1 data-testid="page-heading" className="text-3xl font-display font-bold uppercase tracking-tight text-black">
          Admin Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-8 max-w-4xl">
        {/* Store Information Section */}
        <Card className="rounded-none border-neutral-200 bg-[#FAFAFA] shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-xl uppercase tracking-wide">Store Info</CardTitle>
            <CardDescription className="font-body text-neutral-500">
              Manage your store&apos;s public identity and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="store-name" className="font-body font-semibold uppercase text-xs tracking-wider">
                Store Name
              </Label>
              <Input
                id="store-name"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                className="rounded-none border-neutral-200 bg-white focus-visible:ring-black"
                placeholder="Enter store name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store-email" className="font-body font-semibold uppercase text-xs tracking-wider">
                Store Email
              </Label>
              <Input
                id="store-email"
                type="email"
                value={storeInfo.email}
                onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                className="rounded-none border-neutral-200 bg-white focus-visible:ring-black"
                placeholder="Enter store email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="font-body font-semibold uppercase text-xs tracking-wider">
                WhatsApp Number
              </Label>
              <Input
                id="whatsapp"
                value={storeInfo.whatsapp}
                onChange={(e) => setStoreInfo({ ...storeInfo, whatsapp: e.target.value })}
                className="rounded-none border-neutral-200 bg-white focus-visible:ring-black"
                placeholder="+92 XXX XXXXXXX"
              />
            </div>
            <Button
              onClick={handleSaveStoreInfo}
              className="w-fit rounded-none bg-black text-white hover:bg-neutral-800 font-body uppercase tracking-widest text-xs px-8 py-4 h-auto"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings Section */}
        <Card className="rounded-none border-neutral-200 bg-[#FAFAFA] shadow-none">
          <CardHeader>
            <CardTitle className="font-display text-xl uppercase tracking-wide">Notification Toggles</CardTitle>
            <CardDescription className="font-body text-neutral-500">
              Configure which automated emails are sent to your customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label className="font-body font-semibold text-sm">Send order confirmation emails</Label>
                <p className="text-xs text-neutral-500 font-body">
                  Automatically send an email to the customer after they place an order.
                </p>
              </div>
              <Switch
                checked={notifications.orderConfirmation}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, orderConfirmation: checked })
                }
                className="rounded-none"
              />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label className="font-body font-semibold text-sm">Send abandoned cart emails</Label>
                <p className="text-xs text-neutral-500 font-body">
                  Automatically send a reminder to customers who leave items in their cart.
                </p>
              </div>
              <Switch
                checked={notifications.abandonedCart}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, abandonedCart: checked })
                }
                className="rounded-none"
              />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label className="font-body font-semibold text-sm">Send shipped emails</Label>
                <p className="text-xs text-neutral-500 font-body">
                  Automatically notify customers when their order has been marked as shipped.
                </p>
              </div>
              <Switch
                checked={notifications.shipped}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, shipped: checked })
                }
                className="rounded-none"
              />
            </div>
            <Button
              onClick={handleSaveToggles}
              className="w-fit rounded-none bg-black text-white hover:bg-neutral-800 font-body uppercase tracking-widest text-xs px-8 py-4 h-auto"
            >
              Save Toggles
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
