import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useListAlerts, useListExpiryAlerts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CalendarClock, MessageCircle, TrendingUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { format, parseISO } from "date-fns";
import { exportProductsCsv, downloadCsv, arrayToCsv } from "@/lib/csvExport";

function generateWhatsAppMessage(alerts: any[]): string {
  if (!alerts.length) return "";
  const lines = [
    "*Mahadev Kirana — Low Stock Alert*",
    `_${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}_`,
    "",
    "Following items need immediate restocking:",
    "",
    ...alerts.map((a, i) =>
      `${i + 1}. *${a.productName}* — ${a.quantity === 0 ? "OUT OF STOCK ❌" : `Only ${a.quantity} left ⚠️`}`
    ),
    "",
    "Please arrange stock at the earliest.",
    "_Mahadev Kirana & General Store, Jodhpur_",
  ];
  return lines.join("\n");
}

function shareOnWhatsApp(alerts: any[]) {
  const msg = generateWhatsAppMessage(alerts);
  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

function exportAlertsCsv(alerts: any[]) {
  const headers = ["Product", "Category", "Status", "Current Stock", "Threshold", "Last Updated"];
  const rows = alerts.map(a => [a.productName, a.categoryName, a.status, a.quantity, a.lowStockThreshold, a.updatedAt?.slice(0, 10)]);
  downloadCsv(arrayToCsv(headers, rows), `stock-alerts-${new Date().toISOString().slice(0, 10)}.csv`);
}

function exportExpiryCsv(alerts: any[]) {
  const headers = ["Product", "Category", "Quantity", "Expiry Date", "Days Until Expiry"];
  const rows = alerts.map(a => [a.productName, a.categoryName, a.quantity, a.expiryDate, a.daysUntilExpiry]);
  downloadCsv(arrayToCsv(headers, rows), `expiry-alerts-${new Date().toISOString().slice(0, 10)}.csv`);
}

export default function Alerts() {
  const { data: stockAlerts, isLoading: stockLoading } = useListAlerts();
  const { data: expiryAlerts, isLoading: expiryLoading } = useListExpiryAlerts({ days: 30 });

  const alerts = Array.isArray(stockAlerts) ? stockAlerts : [];
  const expiry = Array.isArray(expiryAlerts) ? expiryAlerts : [];
  const outOfStock = alerts.filter(a => a.quantity === 0);
  const lowStock = alerts.filter(a => a.quantity > 0);

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-500" /> Alerts & Warnings
          </h1>
          <p className="text-muted-foreground text-sm">
            {alerts.length} stock alert{alerts.length !== 1 ? "s" : ""}
            {expiry.length > 0 && ` · ${expiry.length} expiry warning${expiry.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <Link href="/admin/stock/in">
          <Button className="bg-primary hover:bg-primary/90">
            <TrendingUp className="mr-2 h-4 w-4" /> Restock Items
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="stock">
        <TabsList className="mb-6">
          <TabsTrigger value="stock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stock Alerts
            {alerts.length > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs px-1.5">{alerts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="expiry" className="gap-2">
            <CalendarClock className="h-4 w-4" />
            Expiry Warnings
            {expiry.length > 0 && <Badge className="ml-1 bg-orange-500 text-white text-xs px-1.5">{expiry.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stock">
          {stockLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
            </div>
          ) : alerts.length === 0 ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-12 text-center">
                <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-green-900 mb-1">All Stock Levels Good!</h3>
                <p className="text-green-700">No low stock alerts at this time.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex gap-3 mb-4 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => shareOnWhatsApp(alerts)}
                >
                  <MessageCircle className="h-4 w-4" />
                  Share on WhatsApp ({alerts.length} items)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => exportAlertsCsv(alerts)}
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>

              {outOfStock.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                    Out of Stock ({outOfStock.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {outOfStock.map(alert => (
                      <Card key={alert.id} className="border-red-300 bg-red-50/30">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-bold leading-tight truncate">{alert.productName}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{alert.categoryName}</p>
                            </div>
                            <Badge className="bg-red-100 text-red-800 border-red-200 shrink-0 text-xs">Out of Stock</Badge>
                          </div>
                          <div className="flex items-end justify-between mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Stock</p>
                              <p className="text-2xl font-black text-red-600">0</p>
                            </div>
                            <Link href="/admin/stock/in">
                              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-xs h-7">Restock Now</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {lowStock.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-yellow-700 mb-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />
                    Low Stock ({lowStock.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStock.map(alert => (
                      <Card key={alert.id} className="border-yellow-300 bg-yellow-50/30">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="font-bold leading-tight truncate">{alert.productName}</h3>
                              <p className="text-xs text-muted-foreground mt-0.5">{alert.categoryName}</p>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 shrink-0 text-xs">Low Stock</Badge>
                          </div>
                          <div className="flex items-end justify-between mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Current / Threshold</p>
                              <p className="text-xl font-black text-yellow-600">
                                {alert.quantity} <span className="text-sm font-normal text-muted-foreground">/ {alert.lowStockThreshold}</span>
                              </p>
                            </div>
                            <Link href="/admin/stock/in">
                              <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-700 hover:bg-yellow-50 text-xs h-7">Restock</Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="expiry">
          {expiryLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : expiry.length === 0 ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-12 text-center">
                <CalendarClock className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-bold text-green-900 mb-1">No Expiry Warnings</h3>
                <p className="text-green-700">No products expiring in the next 30 days.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex gap-3 mb-4">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => exportExpiryCsv(expiry)}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {expiry.map(item => {
                  const isExpired = item.daysUntilExpiry < 0;
                  const isCritical = item.daysUntilExpiry >= 0 && item.daysUntilExpiry <= 7;
                  const borderClass = isExpired ? "border-red-400 bg-red-50/40" : isCritical ? "border-orange-300 bg-orange-50/30" : "border-yellow-200 bg-yellow-50/20";
                  return (
                    <Card key={item.id} className={borderClass}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 pr-2">
                            <h3 className="font-bold leading-tight truncate">{item.productName}</h3>
                            <p className="text-xs text-muted-foreground">{item.categoryName}</p>
                          </div>
                          <Badge className={`text-xs shrink-0 ${isExpired ? "bg-red-100 text-red-700" : isCritical ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {isExpired ? "Expired" : `${item.daysUntilExpiry}d left`}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-end mt-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Expiry Date</p>
                            <p className="font-semibold">{format(parseISO(item.expiryDate), "dd MMM yyyy")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">In Stock</p>
                            <p className="font-bold">{item.quantity} units</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
