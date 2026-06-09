import { Router } from "express";
import { db, productsTable, categoriesTable, stockMovementsTable } from "@workspace/db";
import { eq, sql, and, isNotNull } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const products = await db.select().from(productsTable);
    const today = new Date().toISOString().split("T")[0];
    const warnDate = new Date();
    warnDate.setDate(warnDate.getDate() + 30);
    const warnCutoff = warnDate.toISOString().split("T")[0];

    let totalProducts = products.length;
    let inStock = 0, lowStock = 0, outOfStock = 0;
    let inventoryValue = 0, totalCostValue = 0, expiryWarningCount = 0;

    for (const p of products) {
      const price = parseFloat(p.price as string);
      const costPrice = p.costPrice ? parseFloat(p.costPrice as string) : 0;
      inventoryValue += price * p.quantity;
      totalCostValue += costPrice * p.quantity;

      if (p.quantity === 0) outOfStock++;
      else if (p.quantity <= p.lowStockThreshold) lowStock++;
      else inStock++;

      if (p.expiryDate && p.expiryDate <= warnCutoff) expiryWarningCount++;
    }

    return res.json({
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      inventoryValue: Math.round(inventoryValue * 100) / 100,
      totalCostValue: Math.round(totalCostValue * 100) / 100,
      expiryWarningCount,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/category-distribution", async (req, res) => {
  try {
    const rows = await db
      .select({
        category: categoriesTable.name,
        count: sql<number>`CAST(COUNT(${productsTable.id}) AS INTEGER)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.name)
      .orderBy(sql`COUNT(${productsTable.id}) DESC`);

    const total = rows.reduce((sum, r) => sum + r.count, 0);
    return res.json(rows.map(r => ({
      category: r.category,
      count: r.count,
      percentage: total > 0 ? Math.round((r.count / total) * 100 * 10) / 10 : 0,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/monthly-trend", async (req, res) => {
  try {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);

      const movementsIn = await db
        .select({ qty: sql<number>`COALESCE(SUM(${stockMovementsTable.quantity}), 0)` })
        .from(stockMovementsTable)
        .where(and(
          eq(stockMovementsTable.type, "in"),
          sql`${stockMovementsTable.createdAt} >= ${monthStart.toISOString()}`
        ));

      const movementsOut = await db
        .select({ qty: sql<number>`COALESCE(SUM(${stockMovementsTable.quantity}), 0)` })
        .from(stockMovementsTable)
        .where(and(
          eq(stockMovementsTable.type, "out"),
          sql`${stockMovementsTable.createdAt} >= ${monthStart.toISOString()}`
        ));

      const restocked = parseInt((movementsIn[0]?.qty ?? 0).toString());
      const products = await db.select().from(productsTable);
      const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold).length;

      result.push({
        month: months[d.getMonth()],
        restocked,
        lowStock: lowStockCount,
        stockOut: parseInt((movementsOut[0]?.qty ?? 0).toString()),
      });
    }

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/top-categories", async (req, res) => {
  try {
    const rows = await db
      .select({
        category: categoriesTable.name,
        count: sql<number>`CAST(COUNT(${productsTable.id}) AS INTEGER)`,
        value: sql<number>`COALESCE(SUM(CAST(${productsTable.price} AS NUMERIC) * ${productsTable.quantity}), 0)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.name)
      .orderBy(sql`SUM(CAST(${productsTable.price} AS NUMERIC) * ${productsTable.quantity}) DESC`)
      .limit(6);

    return res.json(rows.map(r => ({
      category: r.category,
      count: r.count,
      value: Math.round(parseFloat(r.value.toString()) * 100) / 100,
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
