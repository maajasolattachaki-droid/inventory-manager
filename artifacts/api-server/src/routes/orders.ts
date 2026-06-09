import { Router } from "express";
import { db, ordersTable, orderItemsTable, customersTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

async function fetchOrderWithItems(orderId: number) {
  const orders = await db
    .select({
      id: ordersTable.id,
      customerId: ordersTable.customerId,
      customerName: customersTable.name,
      status: ordersTable.status,
      totalAmount: ordersTable.totalAmount,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
    .where(eq(ordersTable.id, orderId))
    .limit(1);

  if (!orders.length) return null;
  const order = orders[0];

  const items = await db
    .select({
      id: orderItemsTable.id,
      productId: orderItemsTable.productId,
      productName: productsTable.name,
      quantity: orderItemsTable.quantity,
      unitPrice: orderItemsTable.unitPrice,
    })
    .from(orderItemsTable)
    .leftJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
    .where(eq(orderItemsTable.orderId, orderId));

  return {
    ...order,
    customerName: order.customerName || "Unknown",
    totalAmount: parseFloat(order.totalAmount as string),
    createdAt: order.createdAt.toISOString(),
    items: items.map(i => ({ ...i, productName: i.productName || "Unknown", unitPrice: parseFloat(i.unitPrice as string) })),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const { status, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const rows = await db
      .select({
        id: ordersTable.id,
        customerId: ordersTable.customerId,
        customerName: customersTable.name,
        status: ordersTable.status,
        totalAmount: ordersTable.totalAmount,
        createdAt: ordersTable.createdAt,
      })
      .from(ordersTable)
      .leftJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
      .orderBy(desc(ordersTable.createdAt));

    let filtered = rows.map(r => ({
      ...r,
      customerName: r.customerName || "Unknown",
      totalAmount: parseFloat(r.totalAmount as string),
      createdAt: r.createdAt.toISOString(),
      items: [] as any[],
    }));

    if (status) filtered = filtered.filter(r => r.status === status);

    const offset = (pageNum - 1) * limitNum;
    return res.json(filtered.slice(offset, offset + limitNum));
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { customerId, items } = req.body;
    if (!customerId || !items?.length) {
      return res.status(400).json({ error: "customerId and items are required" });
    }

    let totalAmount = 0;
    const itemData: { productId: number; quantity: number; unitPrice: number }[] = [];

    for (const item of items) {
      const products = await db.select().from(productsTable).where(eq(productsTable.id, item.productId)).limit(1);
      if (!products.length) return res.status(404).json({ error: `Product ${item.productId} not found` });
      const product = products[0];
      const price = parseFloat(product.price as string);
      totalAmount += price * item.quantity;
      itemData.push({ productId: item.productId, quantity: item.quantity, unitPrice: price });
    }

    const inserted = await db.insert(ordersTable).values({
      customerId: parseInt(customerId),
      status: "pending",
      totalAmount: totalAmount.toFixed(2),
    }).returning();

    const order = inserted[0];

    for (const item of itemData) {
      await db.insert(orderItemsTable).values({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
      });
    }

    const result = await fetchOrderWithItems(order.id);
    return res.status(201).json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = await fetchOrderWithItems(id);
    if (!result) return res.status(404).json({ error: "Order not found" });
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });

    const updated = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
    if (!updated.length) return res.status(404).json({ error: "Order not found" });

    const result = await fetchOrderWithItems(id);
    return res.json(result);
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
