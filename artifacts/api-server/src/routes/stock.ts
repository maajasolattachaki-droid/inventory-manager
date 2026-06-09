import { Router } from "express";
import { db, stockMovementsTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

router.get("/stock/movements", async (req, res) => {
  try {
    const { productId, type, page = "1", limit = "50" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit)));

    const rows = await db
      .select({
        id: stockMovementsTable.id,
        productId: stockMovementsTable.productId,
        productName: productsTable.name,
        type: stockMovementsTable.type,
        quantity: stockMovementsTable.quantity,
        reason: stockMovementsTable.reason,
        createdAt: stockMovementsTable.createdAt,
      })
      .from(stockMovementsTable)
      .leftJoin(productsTable, eq(stockMovementsTable.productId, productsTable.id))
      .orderBy(desc(stockMovementsTable.createdAt));

    let filtered = rows.map(r => ({
      ...r,
      productName: r.productName || "Unknown",
      createdAt: r.createdAt.toISOString(),
    }));

    if (productId) filtered = filtered.filter(r => r.productId === parseInt(productId));
    if (type) filtered = filtered.filter(r => r.type === type);

    const offset = (pageNum - 1) * limitNum;
    return res.json(filtered.slice(offset, offset + limitNum));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/stock/movements", async (req, res) => {
  try {
    const { productId, type, quantity, reason } = req.body;
    if (!productId || !type || !quantity) {
      return res.status(400).json({ error: "productId, type, and quantity are required" });
    }

    const products = await db.select().from(productsTable).where(eq(productsTable.id, parseInt(productId))).limit(1);
    if (!products.length) return res.status(404).json({ error: "Product not found" });

    const product = products[0];
    const qty = parseInt(quantity);

    // Update product quantity
    const newQty = type === "in" ? product.quantity + qty : Math.max(0, product.quantity - qty);
    await db.update(productsTable).set({ quantity: newQty, updatedAt: new Date() }).where(eq(productsTable.id, product.id));

    const inserted = await db.insert(stockMovementsTable).values({
      productId: parseInt(productId),
      type,
      quantity: qty,
      reason,
    }).returning();

    const m = inserted[0];
    return res.status(201).json({
      ...m,
      productName: product.name,
      createdAt: m.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
