import { PrismaClient } from "@prisma/client";
import { ENV } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: ENV.DATABASE_URL, // <- garantiert string
      },
    },
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;