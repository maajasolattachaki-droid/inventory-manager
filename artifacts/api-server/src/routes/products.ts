import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, and, ilike, sql, asc } from "drizzle-orm";

const router = Router();

function getStatus(quantity: number, threshold: number): string {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= threshold) return "Low Stock";
  return "In Stock";
}

router.get("/products", async (req, res) => {
  try {
    const { category, status, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        quantity: productsTable.quantity,
        unit: productsTable.unit,
        price: productsTable.price,
        lowStockThreshold: productsTable.lowStockThreshold,
        barcode: productsTable.barcode,
        description: productsTable.description,
        brand: productsTable.brand,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

    let filtered = rows.map(r => ({
      ...r,
      price: parseFloat(r.price as string),
      status: getStatus(r.quantity, r.lowStockThreshold),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q));
    }
    if (category) {
      filtered = filtered.filter(p => p.categoryName?.toLowerCase() === category.toLowerCase() || p.categoryId === parseInt(category));
    }
    if (status) {
      filtered = filtered.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    const total = filtered.length;
    const products = filtered.slice(offset, offset + limitNum);

    return res.json({ products, total, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const { name, categoryId, quantity, unit, price, lowStockThreshold, barcode, description, brand } = req.body;
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ error: "name, categoryId, and price are required" });
    }

    const inserted = await db.insert(productsTable).values({
      name,
      categoryId: parseInt(categoryId),
      quantity: parseInt(quantity) || 0,
      unit: unit || "pcs",
      price: price.toString(),
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      barcode,
      description,
      brand,
    }).returning();

    const p = inserted[0];
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);
    const cat = cats[0];

    return res.status(201).json({
      ...p,
      categoryName: cat?.name || "",
      price: parseFloat(p.price as string),
      status: getStatus(p.quantity, p.lowStockThreshold),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const rows = await db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        categoryId: productsTable.categoryId,
        categoryName: categoriesTable.name,
        quantity: productsTable.quantity,
        unit: productsTable.unit,
        price: productsTable.price,
        lowStockThreshold: productsTable.lowStockThreshold,
        barcode: productsTable.barcode,
        description: productsTable.description,
        brand: productsTable.brand,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    const p = rows[0];
    return res.json({
      ...p,
      price: parseFloat(p.price as string),
      status: getStatus(p.quantity, p.lowStockThreshold),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, categoryId, quantity, unit, price, lowStockThreshold, barcode, description, brand } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (categoryId !== undefined) updates.categoryId = parseInt(categoryId);
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (unit !== undefined) updates.unit = unit;
    if (price !== undefined) updates.price = price.toString();
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = parseInt(lowStockThreshold);
    if (barcode !== undefined) updates.barcode = barcode;
    if (description !== undefined) updates.description = description;
    if (brand !== undefined) updates.brand = brand;

    const updated = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!updated.length) return res.status(404).json({ error: "Product not found" });

    const p = updated[0];
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);
    const cat = cats[0];

    return res.json({
      ...p,
      categoryName: cat?.name || "",
      price: parseFloat(p.price as string),
      status: getStatus(p.quantity, p.lowStockThreshold),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
export { getStatus };
