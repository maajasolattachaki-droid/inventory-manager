import { AdminLayout } from "@/layouts/AdminLayout";
import { useListAlerts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Alerts() {
  const { data: alerts, isLoading } = useListAlerts();

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6" />
            Stock Alerts
          </h1>
          <p className="text-muted-foreground text-sm">Items that require immediate restocking.</p>
        </div>
        <Link href="/admin/stock/in">
          <Button className="bg-primary hover:bg-primary/90">
            <TrendingUp className="mr-2 h-4 w-4" /> Restock Items
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : !alerts?.length ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-green-900 mb-1">All Good!</h3>
            <p className="text-green-700">There are no low stock alerts at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className={alert.quantity === 0 ? "border-red-300 bg-red-50/30" : "border-yellow-300 bg-yellow-50/30"}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{alert.productName}</h3>
                    <p className="text-sm text-muted-foreground">{alert.categoryName}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${alert.quantity === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {alert.status}
                  </div>
                </div>
                
                <div className="flex items-end justify-between mt-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Stock</p>
                    <p className={`text-2xl font-black ${alert.quantity === 0 ? "text-red-600" : "text-yellow-600"}`}>
                      {alert.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground mb-1">Threshold</p>
                    <p className="text-lg font-medium">{alert.lowStockThreshold}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
