import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  useListProducts, useListCategories, useCreateProduct,
  useUpdateProduct, useDeleteProduct,
  getListProductsQueryKey, getGetDashboardStatsQueryKey, getListAlertsQueryKey,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Search, Plus, Filter, Pencil, Trash2, Copy, Tag, Download, Printer, CalendarClock, TrendingUp } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanButton } from "@/components/BarcodeScanner";
import { exportProductsCsv } from "@/lib/csvExport";
import { printProductLabel } from "@/lib/printLabel";

type Product = {
  id: number; name: string; categoryId: number; categoryName: string;
  quantity: number; unit: string; price: number; costPrice: number | null;
  margin: number | null; lowStockThreshold: number; barcode: string | null;
  description: string | null; brand: string | null; status: string;
  expiryDate: string | null; updatedAt: string;
};

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().int().min(0),
  unit: z.string().min(1),
  price: z.coerce.number().min(0, "Price required"),
  costPrice: z.coerce.number().min(0).optional().or(z.literal("")),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  barcode: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  expiryDate: z.string().optional(),
});
type ProductForm = z.infer<typeof productSchema>;

function getStatusColor(status: string) {
  switch (status) {
    case "In Stock": return "bg-green-100 text-green-800 border-green-200";
    case "Low Stock": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "Out of Stock": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getExpiryBadge(expiryDate: string | null) {
  if (!expiryDate) return null;
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">Expired</Badge>;
  if (days <= 7) return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 text-xs">{days}d left</Badge>;
  if (days <= 30) return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">{days}d left</Badge>;
  return <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200 text-xs">{format(parseISO(expiryDate), "MMM d, yy")}</Badge>;
}

function ProductFormDialog({ open, onClose, product }: { open: boolean; onClose: () => void; product?: Product | null }) {
  const { data: categories } = useListCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const defaultVals = product ? {
    name: product.name, categoryId: product.categoryId.toString(),
    quantity: product.quantity, unit: product.unit, price: product.price,
    costPrice: product.costPrice ?? ("" as any),
    lowStockThreshold: product.lowStockThreshold,
    barcode: product.barcode || "", description: product.description || "",
    brand: product.brand || "", expiryDate: product.expiryDate || "",
  } : { unit: "pcs", lowStockThreshold: 10, quantity: 0 };

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultVals,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
  };

  const toPayload = (v: ProductForm) => ({
    name: v.name, categoryId: parseInt(v.categoryId),
    quantity: v.quantity, unit: v.unit, price: v.price,
    costPrice: v.costPrice !== "" && v.costPrice != null ? Number(v.costPrice) : undefined,
    lowStockThreshold: v.lowStockThreshold || 10,
    barcode: v.barcode || undefined, description: v.description || undefined,
    brand: v.brand || undefined, expiryDate: v.expiryDate || undefined,
  });

  const onSubmit = (v: ProductForm) => {
    if (product) {
      updateProduct.mutate({ id: product.id, data: toPayload(v) }, {
        onSuccess: () => { toast({ title: "Product updated" }); invalidate(); onClose(); reset(); },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      createProduct.mutate({ data: toPayload(v) }, {
        onSuccess: () => { toast({ title: "Product created" }); invalidate(); onClose(); reset(); },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  };

  const price = watch("price") || 0;
  const costPrice = Number(watch("costPrice")) || 0;
  const margin = price > 0 && costPrice > 0 ? Math.round(((price - costPrice) / price) * 100 * 10) / 10 : null;
  const isPending = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { onClose(); reset(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Product Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Aashirvaad Atta 5kg" {...register("name")} />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Category <span className="text-red-500">*</span></Label>
              <Select value={watch("categoryId") || ""} onValueChange={v => setValue("categoryId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>{categories?.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Brand</Label>
              <Input placeholder="e.g. Aashirvaad" {...register("brand")} />
            </div>

            <div className="space-y-1">
              <Label>Selling Price (₹) <span className="text-red-500">*</span></Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" {...register("price")} />
            </div>

            <div className="space-y-1">
              <Label>Cost Price (₹)</Label>
              <Input type="number" step="0.01" min="0" placeholder="Your purchase price" {...register("costPrice")} />
              {margin !== null && (
                <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Margin: {margin}%
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Opening Stock</Label>
              <Input type="number" min="0" placeholder="0" {...register("quantity")} />
            </div>

            <div className="space-y-1">
              <Label>Unit</Label>
              <Select value={watch("unit") || "pcs"} onValueChange={v => setValue("unit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["pcs", "kg", "g", "L", "ml", "pack", "box", "dozen", "pair"].map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Low Stock Alert (qty)</Label>
              <Input type="number" min="0" placeholder="10" {...register("lowStockThreshold")} />
            </div>

            <div className="space-y-1">
              <Label className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Expiry Date
              </Label>
              <Input type="date" {...register("expiryDate")} />
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Barcode</Label>
              <div className="flex gap-2">
                <Input placeholder="Scan or type barcode..." value={watch("barcode") || ""} {...register("barcode")} />
                <BarcodeScanButton onScan={code => setValue("barcode", code)} />
              </div>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Textarea placeholder="Optional..." rows={2} {...register("description")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90">
              {isPending ? "Saving..." : product ? "Save Changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Products() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const { toast } = useToast();
  const deleteProduct = useDeleteProduct();
  const createProduct = useCreateProduct();

  const { data: productsData, isLoading } = useListProducts({
    page, limit: 10,
    search: debouncedSearch || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: allProductsData } = useListProducts({ limit: 500 });
  const { data: categories } = useListCategories();

  let debounceTimer: ReturnType<typeof setTimeout>;
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => { setDebouncedSearch(e.target.value); setPage(1); }, 400);
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProduct.mutate({ id: deleteTarget.id }, {
      onSuccess: () => { toast({ title: "Product deleted" }); invalidate(); setDeleteTarget(null); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  };

  const handleDuplicate = (product: Product) => {
    createProduct.mutate({
      data: {
        name: `${product.name} (Copy)`,
        categoryId: product.categoryId,
        quantity: 0,
        unit: product.unit,
        price: product.price,
        costPrice: product.costPrice ?? undefined,
        lowStockThreshold: product.lowStockThreshold,
        barcode: undefined,
        description: product.description ?? undefined,
        brand: product.brand ?? undefined,
        expiryDate: undefined,
      },
    }, {
      onSuccess: () => { toast({ title: "Product duplicated" }); invalidate(); },
      onError: () => toast({ title: "Failed to duplicate", variant: "destructive" }),
    });
  };

  const handleExportCsv = () => {
    const products = allProductsData?.products ?? productsData?.products ?? [];
    if (!products.length) { toast({ title: "No products to export", variant: "destructive" }); return; }
    exportProductsCsv(products);
    toast({ title: `Exported ${products.length} products` });
  };

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products Inventory</h1>
          <p className="text-muted-foreground text-sm">Manage products, pricing, margins, and expiry dates.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-border mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name, brand, or barcode..." className="pl-9 bg-gray-50"
            value={search} onChange={handleSearchChange} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-48">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Categories" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Low Stock">Low Stock</SelectItem>
              <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[240px]">Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price / Cost</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : productsData?.products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    No products found.
                  </TableCell>
                </TableRow>
              ) : (
                productsData?.products.map(p => {
                  const product = p as Product;
                  return (
                    <TableRow key={product.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="font-medium text-gray-900 leading-tight">{product.name}</div>
                        {product.brand && <div className="text-xs text-muted-foreground">{product.brand}</div>}
                        {product.barcode && <div className="text-xs text-muted-foreground font-mono mt-0.5">{product.barcode}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{product.categoryName}</TableCell>
                      <TableCell>
                        <div className="font-medium">₹{product.price}</div>
                        {product.costPrice && <div className="text-xs text-muted-foreground">Cost: ₹{product.costPrice}</div>}
                      </TableCell>
                      <TableCell>
                        {product.margin != null ? (
                          <span className={`text-sm font-medium ${product.margin >= 20 ? "text-green-600" : product.margin >= 10 ? "text-yellow-600" : "text-red-600"}`}>
                            {product.margin}%
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <span className={product.quantity <= product.lowStockThreshold ? "text-red-600 font-bold" : ""}>
                          {product.quantity} {product.unit}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(product.status)}>{product.status}</Badge>
                      </TableCell>
                      <TableCell>{getExpiryBadge(product.expiryDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10"
                                onClick={() => setEditProduct(product)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:bg-blue-50"
                                onClick={() => handleDuplicate(product)}>
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:bg-gray-100"
                                onClick={() => printProductLabel(product)}>
                                <Printer className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Print Label</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50"
                                onClick={() => setDeleteTarget(product)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {productsData && productsData.total > productsData.limit && (
          <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * productsData.limit + 1}–{Math.min(page * productsData.limit, productsData.total)} of {productsData.total}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * productsData.limit >= productsData.total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <ProductFormDialog open={showAdd || !!editProduct} onClose={() => { setShowAdd(false); setEditProduct(null); }} product={editProduct} />

      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
