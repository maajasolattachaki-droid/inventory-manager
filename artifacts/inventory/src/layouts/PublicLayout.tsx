import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Store, ShoppingBasket, Phone, MapPin, Mail } from "lucide-react";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Top Header / Announcement Bar */}
      <div className="bg-primary text-primary-foreground py-2 px-4 text-sm text-center font-medium">
        Free home delivery on orders above ₹500 within Jodhpur!
      </div>

      {/* Main Navigation */}
      <header className="border-b border-border sticky top-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-md text-primary-foreground">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight text-foreground">Mahadev Kirana</h1>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">General Store</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors text-foreground">Home</Link>
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors text-foreground">Categories</Link>
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors text-foreground">Offers</Link>
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors text-foreground">Contact Us</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline" className="hidden sm:flex border-primary text-primary hover:bg-primary/5">
                Admin Login
              </Button>
            </Link>
            <Button className="gap-2 shadow-md">
              <ShoppingBasket className="h-4 w-4" />
              <span className="hidden sm:inline">Order Now</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-6 w-6 text-primary" />
              <h2 className="font-bold text-xl text-white">Mahadev Kirana</h2>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Jodhpur's trusted neighborhood grocery store. We provide high-quality everyday essentials at the best prices.
            </p>
            <div className="flex gap-4">
              {/* Social icons could go here */}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Products</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Offers</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors">Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-primary transition-colors">Grocery & Staples</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Dairy Products</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Snacks & Namkeen</Link></li>
              <li><Link href="/" className="hover:text-primary transition-colors">Household Care</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>123, Main Market Road, Near Clock Tower, Jodhpur, Rajasthan 342001</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary shrink-0" />
                <span>contact@mahadevkirana.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
          © {new Date().getFullYear()} Mahadev Kirana and General Store. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
