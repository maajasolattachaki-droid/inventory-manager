import { useState, useRef } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import {
  useListProducts,
  useListCustomers,
  useCreateOrder,
  useCreateStockMovement,
  getListProductsQueryKey,
  getGetDashboardStatsQueryKey,
  getListAlertsQueryKey,
  getListStockMovementsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanButton } from "@/components/BarcodeScanner";
import {
  ShoppingCart, Plus, Minus, Trash2, Search, CheckCircle2, Receipt, Package,
} from "lucide-react";

type CartItem = {
  productId: number;
  productName: string;
  price: number;
  unit: string;
  quantity: number;
  maxQty: number;
};

export default function QuickSales() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: productsData } = useListProducts({ limit: 200 });
  const { data: customers } = useListCustomers({ limit: 200 });
  const createOrder = useCreateOrder();
  const createMovement = useCreateStockMovement();

  const allProducts = productsData?.products ?? [];
  const filteredProducts = productSearch
    ? allProducts.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.barcode || "").includes(productSearch)
      )
    : allProducts.filter(p => p.quantity > 0);

  const addToCart = (product: typeof allProducts[0]) => {
    if (product.quantity === 0) {
      toast({ title: "Out of stock", variant: "destructive" });
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.productId === product.id);
      if (existing) {
        if (existing.quantity >= existing.maxQty) {
          toast({ title: "Not enough stock", variant: "destructive" });
          return prev;
        }
        return prev.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        unit: product.unit,
        quantity: 1,
        maxQty: product.quantity,
      }];
    });
    setProductSearch("");
  };

  const handleBarcodeScan = (code: string) => {
    const match = allProducts.find(p => p.barcode === code);
    if (match) addToCart(match);
    else toast({ title: `No product found for barcode: ${code}`, variant: "destructive" });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(c => {
          if (c.productId !== productId) return c;
          const newQty = c.quantity + delta;
          if (newQty > c.maxQty) { toast({ title: "Not enough stock", variant: "destructive" }); return c; }
          return { ...c, quantity: newQty };
        })
        .filter(c => c.quantity > 0)
    );
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleCheckout = async () => {
    if (!cart.length) { toast({ title: "Cart is empty", variant: "destructive" }); return; }

    try {
      if (customerId) {
        const order = await new Promise<any>((resolve, reject) => {
          createOrder.mutate(
            { data: { customerId: parseInt(customerId), items: cart.map(c => ({ productId: c.productId, quantity: c.quantity })) } },
            { onSuccess: resolve, onError: reject }
          );
        });
        setLastOrderId(order.id);
      } else {
        // No customer — just record stock out movements
        for (const item of cart) {
          await new Promise<void>((resolve, reject) => {
            createMovement.mutate(
              { data: { productId: item.productId, type: "out", quantity: item.quantity, reason: "Quick sale" } },
              { onSuccess: () => resolve(), onError: reject }
            );
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListStockMovementsQueryKey() });

      setSuccess(true);
    } catch {
      toast({ title: "Sale failed. Try again.", variant: "destructive" });
    }
  };

  const handleNewSale = () => {
    setCart([]);
    setCustomerId("");
    setProductSearch("");
    setSuccess(false);
    setLastOrderId(null);
  };

  if (success) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto mt-12 flex flex-col items-center gap-6 text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-800">Sale Recorded!</h2>
            {lastOrderId && (
              <p className="text-muted-foreground mt-1">Order #{lastOrderId} created successfully.</p>
            )}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
              <p className="text-sm font-medium text-muted-foreground mb-2">Sale Summary</p>
              {cart.map(c => (
                <div key={c.productId} className="flex justify-between text-sm py-1">
                  <span>{c.productName} × {c.quantity}</span>
                  <span className="font-medium">₹{(c.price * c.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-green-700">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleNewSale} className="bg-primary hover:bg-primary/90">
              <ShoppingCart className="mr-2 h-4 w-4" /> New Sale
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <ShoppingCart className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quick Sales — POS</h1>
          <p className="text-muted-foreground text-sm">Record a sale instantly by scanning or searching products.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Product Search Panel */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" /> Add Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product by name or barcode..."
                    className="pl-9"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <BarcodeScanButton onScan={handleBarcodeScan} />
              </div>

              <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                {filteredProducts.slice(0, 30).map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.quantity === 0}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      p.quantity === 0
                        ? "opacity-40 cursor-not-allowed border-gray-200"
                        : "hover:bg-primary/5 hover:border-primary/30 border-border active:bg-primary/10"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.categoryName} · {p.quantity} {p.unit} left</div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="font-bold text-primary">₹{p.price}</div>
                      <div className="text-xs text-muted-foreground">per {p.unit}</div>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No products found.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart + Checkout */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Cart
                {cart.length > 0 && (
                  <Badge className="ml-1 bg-primary text-white">{cart.reduce((s, c) => s + c.quantity, 0)}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>Click products to add them</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {cart.map(item => (
                    <div key={item.productId} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{item.productName}</div>
                        <div className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.productId, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => updateQty(item.productId, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={() => setCart(c => c.filter(x => x.productId !== item.productId))}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-sm font-bold text-primary w-16 text-right shrink-0">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm">Customer (optional)</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Walk-in customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Walk-in customer</SelectItem>
                        {Array.isArray(customers) && customers.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name} — {c.phone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg bg-primary/5 p-3 space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{cart.reduce((s, c) => s + c.quantity, 0)} items</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
                    onClick={handleCheckout}
                    disabled={createOrder.isPending || createMovement.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    {createOrder.isPending || createMovement.isPending ? "Processing..." : "Complete Sale"}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setCart([])}>
                    Clear Cart
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
