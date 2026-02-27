const argon2 = require("argon2");
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "Admin123!";

  const hash = await argon2.hash(password);

  await prisma.users.create({
    data: {
      id: crypto.randomUUID().replace(/-/g, "").slice(0, 25),
      username,
      role: "ADMIN",
      password_hash: hash,
      is_active: true,
      must_change_password: false
    }
  });

  console.log("Admin erstellt:", username);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
