import { Router } from "express";
import { db, customersTable, ordersTable } from "@workspace/db";
import { eq, ilike, sql, desc } from "drizzle-orm";

const router = Router();

router.get("/customers", async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const rows = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        phone: customersTable.phone,
        email: customersTable.email,
        address: customersTable.address,
        totalOrders: sql<number>`CAST(COUNT(${ordersTable.id}) AS INTEGER)`,
        createdAt: customersTable.createdAt,
      })
      .from(customersTable)
      .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
      .groupBy(customersTable.id)
      .orderBy(desc(customersTable.createdAt));

    let filtered = rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() }));

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email || "").toLowerCase().includes(q)
      );
    }

    const offset = (pageNum - 1) * limitNum;
    return res.json(filtered.slice(offset, offset + limitNum));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/customers", async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });

    const inserted = await db.insert(customersTable).values({ name, phone, email, address }).returning();
    const c = inserted[0];
    return res.status(201).json({ ...c, totalOrders: 0, createdAt: c.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, phone, email, address } = req.body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (address !== undefined) updates.address = address;

    const updated = await db.update(customersTable).set(updates).where(eq(customersTable.id, id)).returning();
    if (!updated.length) return res.status(404).json({ error: "Customer not found" });

    const c = updated[0];
    const orderCount = await db
      .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
      .from(ordersTable)
      .where(eq(ordersTable.customerId, id));

    return res.json({ ...c, totalOrders: orderCount[0]?.count || 0, createdAt: c.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(customersTable).where(eq(customersTable.id, id));
    return res.status(204).send();
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
