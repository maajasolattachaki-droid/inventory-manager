import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

function getStatus(quantity: number, threshold: number): string {
  if (quantity === 0) return "Out of Stock";
  if (quantity <= threshold) return "Low Stock";
  return "In Stock";
}

function computeMargin(price: number, costPrice: number | null): number | null {
  if (!costPrice || costPrice <= 0) return null;
  return Math.round(((price - costPrice) / price) * 100 * 10) / 10;
}

router.get("/products", async (req, res) => {
  try {
    const { category, status, search, page = "1", limit = "20", expiryWarning } = req.query as Record<string, string>;
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
        costPrice: productsTable.costPrice,
        lowStockThreshold: productsTable.lowStockThreshold,
        barcode: productsTable.barcode,
        description: productsTable.description,
        brand: productsTable.brand,
        expiryDate: productsTable.expiryDate,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id));

    let filtered = rows.map(r => {
      const price = parseFloat(r.price as string);
      const costPrice = r.costPrice ? parseFloat(r.costPrice as string) : null;
      return {
        ...r,
        price,
        costPrice,
        margin: computeMargin(price, costPrice),
        status: getStatus(r.quantity, r.lowStockThreshold),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        expiryDate: r.expiryDate || null,
      };
    });

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.barcode || "").includes(q)
      );
    }
    if (category) {
      filtered = filtered.filter(p =>
        p.categoryName?.toLowerCase() === category.toLowerCase() ||
        p.categoryId === parseInt(category)
      );
    }
    if (status) {
      filtered = filtered.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }
    if (expiryWarning === "true") {
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);
      filtered = filtered.filter(p => p.expiryDate && new Date(p.expiryDate) <= soon);
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
    const { name, categoryId, quantity, unit, price, costPrice, lowStockThreshold, barcode, description, brand, expiryDate } = req.body;
    if (!name || !categoryId || price === undefined) {
      return res.status(400).json({ error: "name, categoryId, and price are required" });
    }

    const inserted = await db.insert(productsTable).values({
      name,
      categoryId: parseInt(categoryId),
      quantity: parseInt(quantity) || 0,
      unit: unit || "pcs",
      price: price.toString(),
      costPrice: costPrice ? costPrice.toString() : null,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      barcode: barcode || null,
      description: description || null,
      brand: brand || null,
      expiryDate: expiryDate || null,
    }).returning();

    const p = inserted[0];
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);
    const cat = cats[0];
    const priceNum = parseFloat(p.price as string);
    const costPriceNum = p.costPrice ? parseFloat(p.costPrice as string) : null;

    return res.status(201).json({
      ...p,
      categoryName: cat?.name || "",
      price: priceNum,
      costPrice: costPriceNum,
      margin: computeMargin(priceNum, costPriceNum),
      status: getStatus(p.quantity, p.lowStockThreshold),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      expiryDate: p.expiryDate || null,
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
        costPrice: productsTable.costPrice,
        lowStockThreshold: productsTable.lowStockThreshold,
        barcode: productsTable.barcode,
        description: productsTable.description,
        brand: productsTable.brand,
        expiryDate: productsTable.expiryDate,
        createdAt: productsTable.createdAt,
        updatedAt: productsTable.updatedAt,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id))
      .limit(1);

    if (!rows.length) return res.status(404).json({ error: "Product not found" });
    const p = rows[0];
    const priceNum = parseFloat(p.price as string);
    const costPriceNum = p.costPrice ? parseFloat(p.costPrice as string) : null;
    return res.json({
      ...p,
      price: priceNum,
      costPrice: costPriceNum,
      margin: computeMargin(priceNum, costPriceNum),
      status: getStatus(p.quantity, p.lowStockThreshold),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      expiryDate: p.expiryDate || null,
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, categoryId, quantity, unit, price, costPrice, lowStockThreshold, barcode, description, brand, expiryDate } = req.body;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (categoryId !== undefined) updates.categoryId = parseInt(categoryId);
    if (quantity !== undefined) updates.quantity = parseInt(quantity);
    if (unit !== undefined) updates.unit = unit;
    if (price !== undefined) updates.price = price.toString();
    if (costPrice !== undefined) updates.costPrice = costPrice ? costPrice.toString() : null;
    if (lowStockThreshold !== undefined) updates.lowStockThreshold = parseInt(lowStockThreshold);
    if (barcode !== undefined) updates.barcode = barcode || null;
    if (description !== undefined) updates.description = description || null;
    if (brand !== undefined) updates.brand = brand || null;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate || null;

    const updated = await db.update(productsTable).set(updates).where(eq(productsTable.id, id)).returning();
    if (!updated.length) return res.status(404).json({ error: "Product not found" });

    const p = updated[0];
    const cats = await db.select().from(categoriesTable).where(eq(categoriesTable.id, p.categoryId)).limit(1);
    const cat = cats[0];
    const priceNum = parseFloat(p.price as string);
    const costPriceNum = p.costPrice ? parseFloat(p.costPrice as string) : null;

    return res.json({
      ...p,
      categoryName: cat?.name || "",
      price: priceNum,
      costPrice: costPriceNum,
      margin: computeMargin(priceNum, costPriceNum),
      status: getStatus(p.quantity, p.lowStockThreshold),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      expiryDate: p.expiryDate || null,
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
