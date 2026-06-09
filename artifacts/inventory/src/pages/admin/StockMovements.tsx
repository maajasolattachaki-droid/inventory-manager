import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useListStockMovements } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StockMovements() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListStockMovements({ page, limit: 15 });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground text-sm">Log of all stock coming in and going out.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                </TableRow>
              ))
            ) : !data?.movements?.length ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No stock movements recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              data.movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell className="text-sm whitespace-nowrap">
                    {format(new Date(movement.createdAt), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell>
                    {movement.type === "in" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                        <ArrowDownRight className="h-3 w-3" /> Stock In
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                        <ArrowUpRight className="h-3 w-3" /> Stock Out
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {movement.type === "in" ? "+" : "-"}{movement.quantity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm truncate max-w-[200px]" title={movement.reason || ""}>
                    {movement.reason || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {data && data.total > data.limit && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50">
            <div className="text-sm text-muted-foreground">
              Page {data.page}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page * data.limit >= data.total}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
