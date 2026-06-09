import { useRoute } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StockForm() {
  const [matchIn] = useRoute("/admin/stock/in");
  const type = matchIn ? "in" : "out";

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight mb-6">
          {type === "in" ? "Stock In (Restock)" : "Stock Out (Adjustment)"}
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>Record Stock Movement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Stock movement form will go here.</p>
            <Button>Save</Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
