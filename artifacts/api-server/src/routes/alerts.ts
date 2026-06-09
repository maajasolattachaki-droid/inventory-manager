import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, lte, gt } from "drizzle-orm";

const router = Router();

router.get("/alerts", async (req, res) => {
  try {
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

    return res.json(rows.map(r => ({
      ...r,
      categoryName: r.categoryName || "Unknown",
      status: r.quantity === 0 ? "Out of Stock" : "Low Stock",
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
