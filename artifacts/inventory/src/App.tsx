import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/admin/Dashboard";
import Products from "@/pages/admin/Products";
import ProductDetail from "@/pages/admin/ProductDetail";
import Categories from "@/pages/admin/Categories";
import StockMovements from "@/pages/admin/StockMovements";
import StockForm from "@/pages/admin/StockForm";
import Orders from "@/pages/admin/Orders";
import Customers from "@/pages/admin/Customers";
import Alerts from "@/pages/admin/Alerts";
import Reports from "@/pages/admin/Reports";
import QuickSales from "@/pages/admin/QuickSales";
import NotFound from "@/pages/not-found";

function AdminRoutes() {
  return (
    <ProtectedRoute>
      <Switch>
        <Route path="/admin/dashboard" component={Dashboard} />
        <Route path="/admin/quick-sales" component={QuickSales} />
        <Route path="/admin/products" component={Products} />
        <Route path="/admin/products/:id" component={ProductDetail} />
        <Route path="/admin/categories" component={Categories} />
        <Route path="/admin/stock/in" component={StockForm} />
        <Route path="/admin/stock/out" component={StockForm} />
        <Route path="/admin/stock" component={StockMovements} />
        <Route path="/admin/orders" component={Orders} />
        <Route path="/admin/customers" component={Customers} />
        <Route path="/admin/alerts" component={Alerts} />
        <Route path="/admin/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/admin" component={() => {
        window.location.href = "/admin/dashboard";
        return null;
      }} />
      <Route path="/admin/*" component={AdminRoutes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
