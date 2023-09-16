import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const email = "igor@igor.com";

  // cleanup the existing database
  await prisma.user.delete({ where: { email } }).catch(() => {
    // no worries if it doesn't exist yet
  });

  const hashedPassword = await bcrypt.hash("igor1234", 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: "Igor Ribeiro",
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });

  await prisma.trip.create({
    data: {
      userId: user.id,
      name: "Florida US x BR",
      ticketCost: 9000,
      localCurrency: "BRL",
      abroadCurrency: "USD",
      abroadTaxPercentage: 6.38,
      abroadConversionRate: 4.86687,
      products: {
        create: [
          {
            name: "iPhone 15 Pro 256gb",
            quantity: 2,
            abroadPrice: 1200,
            localPrice: 11000,
          },
          {
            name: "Macbook Air M2 15' 256gb",
            quantity: 2,
            abroadPrice: 1300,
            localPrice: 15000,
          },
          {
            name: "Apple Watch Series 9",
            quantity: 2,
            abroadPrice: 400,
            localPrice: 5000,
          },
          {
            name: "AirPods (3ª geração)",
            quantity: 2,
            abroadPrice: 180,
            localPrice: 2000,
          },
        ],
      },
    },
  });

  await prisma.trip.create({
    data: {
      userId: user.id,
      name: "Florida US x BR 2",
      ticketCost: 0,
      localCurrency: "BRL",
      abroadCurrency: "USD",
      abroadTaxPercentage: 6.38,
      abroadConversionRate: 4.86687,
      products: {
        create: [
          {
            name: "iPhone 15 Pro 256gb",
            quantity: 2,
            abroadPrice: 1200,
            localPrice: 5000,
          },
          {
            name: "Macbook Air M2 15' 256gb",
            abroadPrice: 1500,
            localPrice: 5500,
          },
        ],
      },
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
