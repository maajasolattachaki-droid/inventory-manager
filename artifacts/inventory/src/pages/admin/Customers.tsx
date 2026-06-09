import { useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useListCustomers } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Phone, Mail } from "lucide-react";
import { format } from "date-fns";

export default function Customers() {
  const [page, setPage] = useState(1);
  const { data: customersData, isLoading } = useListCustomers({ page, limit: 10 });

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">Manage customer profiles.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Total Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !customersData?.customers?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center">
                    <Users className="h-8 w-8 mb-2 opacity-20" />
                    <p>No customers found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customersData.customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3 text-muted-foreground"/> {customer.phone}</div>
                      {customer.email && <div className="flex items-center gap-1 text-muted-foreground mt-0.5"><Mail className="h-3 w-3"/> {customer.email}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(customer.createdAt), "MMM d, yyyy")}</TableCell>
                  <TableCell className="text-right font-medium">{customer.totalOrders || 0}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
