import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ShoppingBag, 
  Wheat, 
  Droplets, 
  Coffee, 
  IceCream, 
  Sparkles, 
  Heart,
  Search,
  ArrowRight,
  CheckCircle2,
  Star,
  ShoppingCart
} from "lucide-react";
import { motion } from "framer-motion";
import { useListProducts } from "@workspace/api-client-react";

const categories = [
  { name: "Grocery & Staples", icon: ShoppingBag, color: "bg-orange-100 text-orange-600" },
  { name: "Rice & Grains", icon: Wheat, color: "bg-amber-100 text-amber-600" },
  { name: "Oil & Ghee", icon: Droplets, color: "bg-yellow-100 text-yellow-600" },
  { name: "Tea & Coffee", icon: Coffee, color: "bg-stone-100 text-stone-600" },
  { name: "Dairy & Ice Cream", icon: IceCream, color: "bg-blue-100 text-blue-600" },
  { name: "Cleaning Essentials", icon: Sparkles, color: "bg-cyan-100 text-cyan-600" },
  { name: "Personal Care", icon: Heart, color: "bg-pink-100 text-pink-600" },
];

export default function Home() {
  const { data: featuredProducts } = useListProducts({ limit: 8, page: 1 });

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-primary-foreground space-y-6"
            >
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Fresh Groceries, <br />
                <span className="text-accent">Delivered</span> to Your Doorstep
              </h1>
              <p className="text-lg md:text-xl opacity-90 max-w-lg">
                Jodhpur's most trusted neighborhood store. We bring you the best quality staples, spices, and daily essentials at wholesale prices.
              </p>
              
              <div className="bg-white p-2 rounded-lg flex items-center shadow-lg max-w-md">
                <Search className="h-5 w-5 text-muted-foreground ml-2" />
                <Input 
                  type="text" 
                  placeholder="Search for atta, dal, oil..." 
                  className="border-0 focus-visible:ring-0 shadow-none text-foreground"
                />
                <Button className="bg-accent hover:bg-accent/90 text-white rounded-md px-6">
                  Search
                </Button>
              </div>
              
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> 100% Quality
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Free Delivery
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Best Prices
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="hidden md:block relative"
            >
              <div className="aspect-square rounded-full bg-white/20 absolute -inset-4 blur-2xl"></div>
              <img 
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1000" 
                alt="Fresh Groceries" 
                className="rounded-2xl shadow-2xl relative z-10 border-4 border-white/20 object-cover aspect-video"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-600">Find exactly what you need from our wide selection</p>
            </div>
            <Button variant="ghost" className="hidden sm:flex items-center text-primary font-semibold hover:bg-primary/5">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-all cursor-pointer border-transparent hover:border-primary/20 text-center h-full group">
                  <CardContent className="p-6 flex flex-col items-center justify-center gap-4">
                    <div className={`p-4 rounded-full ${category.color} group-hover:scale-110 transition-transform`}>
                      <category.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-semibold text-sm">{category.name}</h3>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts?.products?.map((product) => (
              <Card key={product.id} className="overflow-hidden group hover:shadow-xl transition-shadow border-gray-100">
                <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center p-6">
                  {/* Placeholder image since we don't have product images in schema */}
                  <ShoppingBag className="h-24 w-24 text-gray-300 group-hover:scale-110 transition-transform" />
                  {product.quantity < 10 && product.quantity > 0 && (
                    <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Only {product.quantity} left
                    </div>
                  )}
                  {product.quantity === 0 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Out of Stock
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">
                    {product.categoryName}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate" title={product.name}>
                    {product.name}
                  </h3>
                  <div className="text-sm text-gray-500 mb-4">{product.unit}</div>
                  
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xl text-gray-900">
                      ₹{product.price}
                    </div>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-white shadow-sm" disabled={product.quantity === 0}>
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Fallback if no products */}
            {(!featuredProducts || featuredProducts.products.length === 0) && (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden border-gray-100">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center animate-pulse">
                    <ShoppingBag className="h-16 w-16 text-gray-200" />
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Mahadev Kirana?</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We've been serving the Jodhpur community for over 15 years. We pride ourselves on providing the highest quality groceries at fair, transparent prices. When you shop with us, you're not just a customer, you're family.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Premium Quality</h3>
                    <p className="text-gray-600 text-sm">We handpick our grains and spices to ensure you only get the best.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Wide Assortment</h3>
                    <p className="text-gray-600 text-sm">From daily staples to specialty ingredients, find everything under one roof.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-white p-3 rounded-full shadow-sm text-primary">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Trusted by 5000+ Families</h3>
                    <p className="text-gray-600 text-sm">Our community trusts us for our honesty, hygiene, and excellent service.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" className="rounded-lg shadow-md mt-8" alt="Store interior" />
              <img src="https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=600" className="rounded-lg shadow-md" alt="Spices" />
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
