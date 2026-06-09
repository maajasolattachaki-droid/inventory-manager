import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useListOrders } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Orders() {
  const [page, setPage] = useState(1);
  const { data: ordersData, isLoading } = useListOrders({ page, limit: 10 });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">Manage customer orders.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !ordersData?.orders?.length ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <ShoppingCart className="h-8 w-8 mb-2 opacity-20" />
                    <p>No orders found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              ordersData.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">#{order.id}</TableCell>
                  <TableCell className="text-sm">{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      order.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                      order.status === "pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-gray-50 text-gray-700 border-gray-200"
                    }>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{order.items.length}</TableCell>
                  <TableCell className="text-right font-bold text-accent">₹{order.totalAmount.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {ordersData && ordersData.total > ordersData.limit && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50">
             <div className="text-sm text-muted-foreground">
               Page {ordersData.page}
             </div>
             <div className="flex gap-2">
               <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
               <Button variant="outline" size="sm" disabled={page * ordersData.limit >= ordersData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
             </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
