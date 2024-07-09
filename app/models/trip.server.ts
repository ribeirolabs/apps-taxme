import type { User, Trip, TripProduct, Prisma } from "@prisma/client";

import { prisma } from "~/db.server";

export type TripWithProducts = Trip & {
  products: TripProduct[];
};

export type TripSummaryWithProducts = Trip & {
  products: TripProductWithSummary[];
  productsCount: number;
  totalAbroad: number;
  totalAbroadConverted: number;
  totalLocal: number;
  totalLocalConverted: number;
  totalSavings: number;
  totalSavingsConverted: number;
};

export type TripProductWithSummary = TripProduct & {
  localPriceConverted: number;
  abroadPriceConverted: number;
  abroadPriceWithTax: number;
  savings: number;
  savingsConverted: number;
};

export function calculateProduct({
  trip,
  product,
}: {
  trip: Trip;
  product: TripProduct;
}) {
  const abroadPriceWithTax =
    product.abroadPrice +
    product.abroadPrice * (trip.abroadTaxPercentage / 100);

  const abroadPriceConverted = abroadPriceWithTax * trip.abroadConversionRate;
  const localPriceConverted = product.localPrice / trip.abroadConversionRate;
  const savings =
    product.quantity * product.localPrice -
    product.quantity * abroadPriceConverted;
  const savingsConverted = savings / trip.abroadConversionRate;

  return {
    ...product,
    localPriceConverted,
    abroadPriceWithTax,
    abroadPriceConverted,
    savings,
    savingsConverted,
  } satisfies TripProductWithSummary;
}

export function getTrips({ userId }: { userId: User["id"] }) {
  return prisma.trip.findMany({
    where: { userId },
    include: {
      products: true,
    },
  });
}

export function calculateTripSummary(
  trip: TripWithProducts
): TripSummaryWithProducts {
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
      (total, product) => total + product.abroadPrice * product.quantity,
      trip.ticketCost / trip.abroadConversionRate
    ),
    totalAbroadConverted: products.reduce(
      (total, product) =>
        total + product.abroadPriceConverted * product.quantity,
      trip.ticketCost
    ),
    totalLocal: products.reduce(
      (total, product) => total + product.localPrice * product.quantity,
      0
    ),
    totalLocalConverted: products.reduce(
      (total, product) =>
        total + product.localPriceConverted * product.quantity,
      0
    ),
    totalSavings:
      products.reduce((total, product) => total + product.savings, 0) -
      trip.ticketCost,
    totalSavingsConverted:
      products.reduce((total, product) => total + product.savingsConverted, 0) -
      trip.ticketCost / trip.abroadConversionRate,
  };
}

export async function getTripsWithSummary({ userId }: { userId: User["id"] }) {
  const trips = await getTrips({ userId });

  return trips.map((trip) => calculateTripSummary(trip));
}

export function getTrip({
  id,
  userId,
}: Pick<Trip, "id"> & {
  userId: User["id"];
}) {
  return prisma.trip.findFirst({
    where: { id, userId },
    include: {
      products: true,
    },
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

export function updateTrip({
  id,
  userId,
  data,
}: Pick<Trip, "id"> & {
  userId: User["id"];
  data: Prisma.TripUpdateInput & {
    products: Record<string, [number, number]>;
  };
}) {
  const { products, ...trip } = data;

  return prisma.trip.update({
    data: {
      ...trip,
      products: {
        updateMany: Object.keys(products).map((id) => ({
          data: {
            abroadPrice: products[id][0],
            localPrice: products[id][1],
          },
          where: {
            id,
          },
        })),
      },
    },
    where: { id, userId },
    include: {
      products: true,
    },
  });
}
