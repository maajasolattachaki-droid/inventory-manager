import { useState } from "react";
import { Link } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useListStockMovements } from "@workspace/api-client-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ArrowDownToLine, ArrowUpFromLine, Plus } from "lucide-react";

const LIMIT = 15;

export default function StockMovements() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListStockMovements({ page, limit: LIMIT });

  // API returns StockMovement[] directly (array, not wrapped object)
  const movements = Array.isArray(data) ? data : [];

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground text-sm">Complete log of all stock coming in and going out.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/stock/out">
            <Button variant="outline" size="sm" className="gap-2 text-red-600 border-red-200 hover:bg-red-50">
              <ArrowUpFromLine className="h-4 w-4" /> Stock Out
            </Button>
          </Link>
          <Link href="/admin/stock/in">
            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700">
              <ArrowDownToLine className="h-4 w-4" /> Stock In
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <p>No stock movements recorded yet.</p>
                    <Link href="/admin/stock/in">
                      <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                        <Plus className="h-4 w-4" /> Record First Movement
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              movements.map((movement) => (
                <TableRow key={movement.id} className="hover:bg-gray-50/50">
                  <TableCell className="text-sm whitespace-nowrap text-muted-foreground">
                    {format(new Date(movement.createdAt), "MMM d, yyyy")}
                    <div className="text-xs">{format(new Date(movement.createdAt), "HH:mm")}</div>
                  </TableCell>
                  <TableCell className="font-medium">{movement.productName}</TableCell>
                  <TableCell>
                    {movement.type === "in" ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                        <ArrowDownToLine className="h-3 w-3" /> Stock In
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
                        <ArrowUpFromLine className="h-3 w-3" /> Stock Out
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${movement.type === "in" ? "text-green-600" : "text-red-600"}`}>
                      {movement.type === "in" ? "+" : "−"}{movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate" title={movement.reason || ""}>
                    {movement.reason || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50">
          <div className="text-sm text-muted-foreground">
            Page {page} · {movements.length} records
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={movements.length < LIMIT}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
