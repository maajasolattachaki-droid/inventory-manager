import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, lte, isNotNull, sql } from "drizzle-orm";

const router = Router();

router.get("/alerts", async (req, res) => {
  try {
    const { limit } = req.query as Record<string, string>;
    const rows = await db
      .select({
        id: productsTable.id,
        productId: productsTable.id,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        quantity: productsTable.quantity,
        lowStockThreshold: productsTable.lowStockThreshold,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(lte(productsTable.quantity, productsTable.lowStockThreshold))
      .orderBy(productsTable.quantity);

    let result = rows.map(r => ({
      ...r,
      categoryName: r.categoryName || "Unknown",
      status: r.quantity === 0 ? "Out of Stock" : "Low Stock",
      updatedAt: r.updatedAt.toISOString(),
    }));

    if (limit) result = result.slice(0, parseInt(limit));

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/alerts/expiry", async (req, res) => {
  try {
    const { days = "30" } = req.query as Record<string, string>;
    const daysNum = parseInt(days);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + daysNum);
    const cutoff = cutoffDate.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const rows = await db
      .select({
        id: productsTable.id,
        productId: productsTable.id,
        productName: productsTable.name,
        categoryName: categoriesTable.name,
        quantity: productsTable.quantity,
        expiryDate: productsTable.expiryDate,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(isNotNull(productsTable.expiryDate));

    const result = rows
      .filter(r => r.expiryDate && r.expiryDate <= cutoff)
      .map(r => {
        const expiry = new Date(r.expiryDate!);
        const now = new Date(today);
        const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: r.id,
          productId: r.productId,
          productName: r.productName,
          categoryName: r.categoryName || "Unknown",
          quantity: r.quantity,
          expiryDate: r.expiryDate!,
          daysUntilExpiry: diff,
        };
      })
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
