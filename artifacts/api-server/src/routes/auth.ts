import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "mahadev_salt").digest("hex");
}

router.post("/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    if (!users.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];
    const hash = hashPassword(password);
    if (hash !== user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    (req as any).session = { userId: user.id };
    (req as any).sessionUser = { id: user.id, username: user.username, role: user.role };

    // Set a simple session cookie
    res.cookie("session_user_id", user.id.toString(), { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("session_role", user.role, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("session_username", user.username, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.json({ user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  res.clearCookie("session_user_id");
  res.clearCookie("session_role");
  res.clearCookie("session_username");
  return res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  try {
    const userId = req.cookies?.session_user_id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const users = await db.select().from(usersTable).where(eq(usersTable.id, parseInt(userId))).limit(1);
    if (!users.length) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = users[0];
    return res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
export { hashPassword };
