import type { User, Trip, TripProduct } from "@prisma/client";

import { prisma } from "~/db.server";

function calculateProduct({
  trip,
  product,
}: {
  trip: Trip;
  product: TripProduct;
}) {
  const abroadPriceWithTax =
    (product.abroadPrice +
      product.abroadPrice * (trip.abroadTaxPercentage / 100)) *
    product.quantity;

  const abroadPriceConverted = abroadPriceWithTax * trip.abroadConversionRate;
  const localPrice = product.localPrice * product.quantity;
  const localPriceConverted = localPrice / trip.abroadConversionRate;
  const savings = localPrice - abroadPriceConverted;
  const savingsConverted = savings / trip.abroadConversionRate;

  return {
    ...product,
    localPrice,
    localPriceConverted,
    abroadPrice: abroadPriceWithTax,
    abroadPriceConverted,
    savings,
    savingsConverted,
  } satisfies TripProduct & {
    localPriceConverted: number;
    abroadPriceConverted: number;
    savings: number;
    savingsConverted: number;
  };
}

export function getTrips({ userId }: { userId: User["id"] }) {
  return prisma.trip.findMany({
    where: { userId },
    include: {
      products: true,
    },
  });
}

export async function getTripsWithSummary({ userId }: { userId: User["id"] }) {
  const trips = await getTrips({ userId });

  return trips.map((trip) => {
    const products = trip.products.map((product) => ({
      ...calculateProduct({ product, trip }),
    }));

    return {
      ...trip,
      products,
      productsCount: products.reduce(
        (total, product) => total + product.quantity,
        0
      ),
      totalAbroad: products.reduce(
        (total, product) => total + product.abroadPrice,
        0
      ),
      totalAbroadConverted: products.reduce(
        (total, product) => total + product.abroadPriceConverted,
        0
      ),
      totalLocal: products.reduce(
        (total, product) => total + product.localPrice,
        0
      ),
      totalLocalConverted: products.reduce(
        (total, product) => total + product.localPriceConverted,
        0
      ),
      totalSavings:
        products.reduce((total, product) => total + product.savings, 0) -
        trip.ticketCost,
      totalSavingsConverted:
        products.reduce(
          (total, product) => total + product.savingsConverted,
          0
        ) -
        trip.ticketCost / trip.abroadConversionRate,
    };
  });
}

export function getTrip({
  id,
  userId,
}: Pick<Trip, "id"> & {
  userId: User["id"];
}) {
  return prisma.trip.findFirst({
    where: { id, userId },
  });
}

export function createTrip({
  userId,
  ...data
}: Trip & {
  userId: User["id"];
}) {
  return prisma.trip.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      ...data,
    },
  });
}

export function deleteTrip({
  id,
  userId,
}: Pick<Trip, "id"> & { userId: User["id"] }) {
  return prisma.trip.deleteMany({
    where: { id, userId },
  });
}
