import { useGetDashboardStats, useGetCategoryDistribution, useGetMonthlyTrend, useListAlerts } from "@workspace/api-client-react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  IndianRupee,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const COLORS = ['#16a34a', '#f97316', '#3b82f6', '#eab308', '#ec4899', '#8b5cf6', '#64748b'];
const STATUS_COLORS = {
  inStock: '#16a34a',
  lowStock: '#eab308',
  outOfStock: '#ef4444'
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: categoryDist, isLoading: distLoading } = useGetCategoryDistribution();
  const { data: monthlyTrend, isLoading: trendLoading } = useGetMonthlyTrend();
  const { data: alerts, isLoading: alertsLoading } = useListAlerts({ limit: 5 });

  const stockStatusData = stats ? [
    { name: 'In Stock', value: stats.inStock, color: STATUS_COLORS.inStock },
    { name: 'Low Stock', value: stats.lowStock, color: STATUS_COLORS.lowStock },
    { name: 'Out of Stock', value: stats.outOfStock, color: STATUS_COLORS.outOfStock },
  ] : [];

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm">Here's what's happening in your store today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/stock/in">
            <Button className="bg-primary text-primary-foreground shadow-sm">
              <TrendingUp className="mr-2 h-4 w-4" /> Quick Restock
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-green-600">{stats?.inStock || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-yellow-600">{stats?.lowStock || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-red-600">{stats?.outOfStock || 0}</div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-accent shadow-sm bg-accent/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-accent-foreground">Inventory Value</CardTitle>
            <IndianRupee className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold text-accent">₹{(stats?.inventoryValue || 0).toLocaleString('en-IN')}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stock Status Donut */}
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Stock Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {statsLoading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stockStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stockStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [value, 'Products']} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Inventory by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              {distLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={categoryDist}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="var(--color-primary)" radius={[4, 4, 0, 0]} name="Products" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Restocking Trend */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Restocking Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {trendLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart
                    data={monthlyTrend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Legend />
                    <Bar dataKey="restocked" name="Restocked Items" fill="var(--color-primary)" radius={[4, 4, 0, 0]} stackId="a" />
                    <Bar dataKey="lowStock" name="Low Stock Alerts" fill="#eab308" radius={[4, 4, 0, 0]} stackId="a" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-red-600 flex items-center">
              <AlertTriangle className="mr-2 h-5 w-5" /> Urgent Attention Required
            </CardTitle>
            <Link href="/admin/alerts">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {alertsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <h4 className="font-semibold text-sm text-red-900">{alert.productName}</h4>
                      <p className="text-xs text-red-700">{alert.categoryName}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-700">
                        {alert.quantity} left
                      </div>
                      <div className="text-xs text-red-600">
                        Threshold: {alert.lowStockThreshold}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <CheckCircle className="h-12 w-12 text-green-400 mb-2 opacity-50" />
                <p>All stock levels look good!</p>
                <p className="text-sm">No urgent alerts right now.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
