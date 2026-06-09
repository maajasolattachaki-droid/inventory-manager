import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useListProducts,
  useCreateStockMovement,
  getListProductsQueryKey,
  getGetDashboardStatsQueryKey,
  getListAlertsQueryKey,
  getListStockMovementsQueryKey,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanButton } from "@/components/BarcodeScanner";
import { ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Package } from "lucide-react";

const schema = z.object({
  productId: z.string().min(1, "Please select a product"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  reason: z.string().optional(),
  barcode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function StockForm() {
  const [matchIn] = useRoute("/admin/stock/in");
  const type = matchIn ? "in" : "out";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [barcodeSearch, setBarcodeSearch] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: productsData } = useListProducts({ limit: 200 });
  const createMovement = useCreateStockMovement();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedProductId = watch("productId");
  const selectedProduct = productsData?.products.find(
    (p) => p.id.toString() === selectedProductId
  );

  // When a barcode is scanned, find and auto-select the matching product
  const handleBarcodeScan = (code: string) => {
    setBarcodeSearch(code);
    setValue("barcode", code);
    const match = productsData?.products.find(
      (p) => p.barcode === code || p.name.toLowerCase().includes(code.toLowerCase())
    );
    if (match) {
      setValue("productId", match.id.toString());
      toast({ title: "Product found", description: match.name });
    } else {
      toast({
        title: "No product matched",
        description: `Barcode: ${code}. Select manually below.`,
        variant: "destructive",
      });
    }
  };

  const onSubmit = (values: FormValues) => {
    createMovement.mutate(
      {
        data: {
          productId: parseInt(values.productId),
          type,
          quantity: values.quantity,
          reason: values.reason,
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListStockMovementsQueryKey() });
          reset();
          setBarcodeSearch("");
        },
        onError: () => {
          toast({ title: "Failed to record movement", variant: "destructive" });
        },
      }
    );
  };

  const isIn = type === "in";

  if (success) {
    return (
      <AdminLayout>
        <div className="max-w-lg mx-auto mt-12 flex flex-col items-center gap-6 text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isIn ? "Stock Added Successfully" : "Stock Removed Successfully"}
            </h2>
            <p className="text-muted-foreground mt-1">
              The stock movement has been recorded and inventory updated.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setSuccess(false)} className="bg-primary hover:bg-primary/90">
              Record Another
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/stock")}>
              View All Movements
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isIn ? "bg-green-100" : "bg-red-100"}`}>
            {isIn
              ? <ArrowDownToLine className="h-5 w-5 text-green-700" />
              : <ArrowUpFromLine className="h-5 w-5 text-red-700" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isIn ? "Stock In — Receive Inventory" : "Stock Out — Adjust Inventory"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isIn
                ? "Record new stock arriving from supplier or restock."
                : "Record stock removed for sale, damage, or adjustment."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Barcode Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Scan or Select Product
              </CardTitle>
              <CardDescription>
                Use the camera to scan a barcode, or search manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <BarcodeScanButton onScan={handleBarcodeScan} />

              {barcodeSearch && (
                <div className="text-sm text-muted-foreground">
                  Last scanned: <span className="font-mono font-medium text-foreground">{barcodeSearch}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="productId">
                  Product <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedProductId || ""}
                  onValueChange={(val) => setValue("productId", val, { shouldValidate: true })}
                >
                  <SelectTrigger className={errors.productId ? "border-red-400" : ""}>
                    <SelectValue placeholder="Search and select a product..." />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData?.products.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({p.quantity} {p.unit} in stock)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productId && (
                  <p className="text-sm text-red-500">{errors.productId.message}</p>
                )}
              </div>

              {selectedProduct && (
                <div className={`rounded-lg p-3 text-sm ${
                  selectedProduct.status === "Out of Stock"
                    ? "bg-red-50 border border-red-200"
                    : selectedProduct.status === "Low Stock"
                    ? "bg-yellow-50 border border-yellow-200"
                    : "bg-green-50 border border-green-200"
                }`}>
                  <div className="font-medium">{selectedProduct.name}</div>
                  <div className="text-muted-foreground mt-0.5">
                    Current stock: <strong>{selectedProduct.quantity} {selectedProduct.unit}</strong>
                    {" · "}Category: {selectedProduct.categoryName}
                    {" · "}₹{selectedProduct.price}/{selectedProduct.unit}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quantity & Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movement Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantity {selectedProduct ? `(${selectedProduct.unit})` : ""} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  placeholder="Enter quantity..."
                  className={errors.quantity ? "border-red-400" : ""}
                  {...register("quantity")}
                />
                {errors.quantity && (
                  <p className="text-sm text-red-500">{errors.quantity.message}</p>
                )}
                {selectedProduct && watch("quantity") > 0 && (
                  <p className="text-xs text-muted-foreground">
                    After this movement:{" "}
                    <span className="font-medium">
                      {isIn
                        ? selectedProduct.quantity + (watch("quantity") || 0)
                        : Math.max(0, selectedProduct.quantity - (watch("quantity") || 0))} {selectedProduct.unit}
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason / Notes</Label>
                <Textarea
                  id="reason"
                  placeholder={isIn ? "e.g. Weekly supplier delivery, Emergency restock..." : "e.g. Customer sale, Damaged goods, Expired..."}
                  rows={3}
                  {...register("reason")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createMovement.isPending}
              className={isIn
                ? "bg-green-600 hover:bg-green-700 flex-1"
                : "bg-red-600 hover:bg-red-700 flex-1"}
            >
              {createMovement.isPending
                ? "Saving..."
                : isIn
                ? "Confirm Stock In"
                : "Confirm Stock Out"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/stock")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
