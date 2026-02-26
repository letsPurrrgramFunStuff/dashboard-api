import crypto from "crypto";
import { eq } from "drizzle-orm";
import { users } from "@database/schema";
import type { Database } from "@database/database";

export class LoginRepository {
  constructor(private db: Database) {}

  async findActiveUserByEmail(email: string) {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0] ?? null;
  }

  async updateLastLogin(userId: number) {
    await this.db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, userId));
  }

  hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}
