import { useRoute, useLocation } from "wouter";
import { AdminLayout } from "@/layouts/AdminLayout";
import { useGetProduct } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Package, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function ProductDetail() {
  const [, params] = useRoute("/admin/products/:id");
  const [, setLocation] = useLocation();
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id }
  });

  return (
    <AdminLayout>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/admin/products")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Product Details</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
          <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      ) : product ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Category</p>
                  <p className="text-lg">{product.categoryName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Price</p>
                  <p className="text-lg font-bold">₹{product.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Brand</p>
                  <p className="text-lg">{product.brand || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Barcode</p>
                  <p className="text-lg">{product.barcode || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Description</p>
                <p className="text-base bg-gray-50 p-4 rounded-md">
                  {product.description || "No description provided."}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Current Stock</p>
                  <p className={`text-3xl font-bold ${
                    product.status === "Out of Stock" ? "text-red-600" :
                    product.status === "Low Stock" ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {product.quantity} <span className="text-lg font-normal text-muted-foreground">{product.unit}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Status</p>
                  <p className="text-lg">{product.status}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Low Stock Threshold</p>
                  <p className="text-lg">{product.lowStockThreshold || 10} {product.unit}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Product ID</p>
                  <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">{product.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Created</p>
                  <p className="text-sm">{format(new Date(product.createdAt), "MMM d, yyyy HH:mm")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Last Updated</p>
                  <p className="text-sm">{format(new Date(product.updatedAt), "MMM d, yyyy HH:mm")}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Product not found</div>
      )}
    </AdminLayout>
  );
}
