import type { User, Trip, TripItem } from "@prisma/client";

import { prisma } from "~/db.server";

function calculateItem({ trip, item }: { trip: Trip; item: TripItem }) {
  const abroadPriceWithTax =
    (item.abroadPrice + item.abroadPrice * (trip.abroadTaxPercentage / 100)) *
    item.quantity;

  const abroadPriceConverted = abroadPriceWithTax * trip.abroadConversionRate;
  const localPrice = item.localPrice * item.quantity;
  const localPriceConverted = localPrice / trip.abroadConversionRate;
  const savings = localPrice - abroadPriceConverted;
  const savingsConverted = savings / trip.abroadConversionRate;

  return {
    ...item,
    localPrice,
    localPriceConverted,
    abroadPrice: abroadPriceWithTax,
    abroadPriceConverted,
    savings,
    savingsConverted,
  } satisfies TripItem & {
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
      items: true,
    },
  });
}

export async function getTripsWithSummary({ userId }: { userId: User["id"] }) {
  const trips = await getTrips({ userId });

  return trips.map((trip) => {
    const items = trip.items.map((item) => ({
      ...calculateItem({ item, trip }),
    }));

    return {
      ...trip,
      items,
      itemsCount: items.reduce((total, item) => total + item.quantity, 0),
      totalAbroad: items.reduce((total, item) => total + item.abroadPrice, 0),
      totalAbroadConverted: items.reduce(
        (total, item) => total + item.abroadPriceConverted,
        0
      ),
      totalLocal: items.reduce((total, item) => total + item.localPrice, 0),
      totalLocalConverted: items.reduce(
        (total, item) => total + item.localPriceConverted,
        0
      ),
      totalSavings:
        items.reduce((total, item) => total + item.savings, 0) -
        trip.ticketCost,
      totalSavingsConverted:
        items.reduce((total, item) => total + item.savingsConverted, 0) -
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
