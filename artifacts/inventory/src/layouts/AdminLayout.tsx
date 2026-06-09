import { Link, useLocation } from "wouter";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Package, Tags, ArrowDownToLine, ArrowUpFromLine,
  ClipboardList, ShoppingCart, Users, AlertTriangle, BarChart3,
  LogOut, Store, Menu, ChevronDown, ChevronRight, Zap,
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type NavChild = { href: string; label: string; icon: React.ElementType };
type NavItem = { href?: string; label: string; icon: React.ElementType; children?: NavChild[] };

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/quick-sales", label: "Quick Sales", icon: Zap },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  {
    label: "Inventory",
    icon: ClipboardList,
    children: [
      { href: "/admin/stock/in", label: "Stock In", icon: ArrowDownToLine },
      { href: "/admin/stock/out", label: "Stock Out", icon: ArrowUpFromLine },
      { href: "/admin/stock", label: "Movements Log", icon: ClipboardList },
    ],
  },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/alerts", label: "Alerts", icon: AlertTriangle },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

function NavLinks({ onNavigate, location }: { onNavigate?: () => void; location: string }) {
  const [inventoryOpen, setInventoryOpen] = useState(location.startsWith("/admin/stock"));

  return (
    <>
      {navItems.map((item) => {
        if (item.children) {
          const isActive = item.children.some(c => location === c.href || location.startsWith(c.href + "/"));
          return (
            <div key={item.label}>
              <button
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                  isActive
                    ? "bg-sidebar-primary/20 text-sidebar-primary-foreground font-medium"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => setInventoryOpen(o => !o)}
              >
                <span className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {inventoryOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
              </button>
              {inventoryOpen && (
                <div className="ml-5 mt-1 flex flex-col gap-0.5 border-l border-sidebar-border pl-3">
                  {item.children.map(child => (
                    <Link key={child.href} href={child.href}>
                      <div
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer ${
                          location === child.href
                            ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }`}
                        onClick={onNavigate}
                      >
                        <child.icon className="h-4 w-4 shrink-0" />
                        <span>{child.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return (
          <Link key={item.href} href={item.href!}>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                location === item.href || location.startsWith(item.href! + "/")
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={onNavigate}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {item.href === "/admin/quick-sales" && (
                <span className="ml-auto text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">POS</span>
              )}
            </div>
          </Link>
        );
      })}
    </>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => { queryClient.clear(); setLocation("/login"); },
    });
  };

  const allNavItems = navItems.flatMap(item => item.children ? item.children : [item]);
  const currentLabel = allNavItems.find(item =>
    location === item.href || location.startsWith((item.href || "") + "/")
  )?.label || "Admin Panel";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border shrink-0 fixed inset-y-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground">
            <Store className="h-6 w-6 text-sidebar-primary" />
            <span>Mahadev Kirana</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <NavLinks location={location} />
        </div>
        <div className="p-4 border-t border-sidebar-border shrink-0">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" /> Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-64 min-w-0">
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 bg-sidebar p-0 border-sidebar-border">
                <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
                  <div className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground">
                    <Store className="h-6 w-6 text-sidebar-primary" />
                    <span>Mahadev Kirana</span>
                  </div>
                </div>
                <div className="py-4 px-3 flex flex-col gap-1">
                  <NavLinks location={location} onNavigate={() => setIsMobileMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-xl font-semibold text-foreground truncate">{currentLabel}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium leading-none">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
