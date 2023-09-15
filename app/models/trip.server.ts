import type { User, Trip, TripItem } from "@prisma/client";

import { prisma } from "~/db.server";

function calculateItem({ trip, item }: { trip: Trip; item: TripItem }) {
  const withTax =
    (item.abroadPrice + item.abroadPrice * (trip.abroadTaxPercentage / 100)) *
    item.quantity;

  const abroadLocalPrice = withTax * trip.abroadConversionRate;
  const savings = item.localPrice * item.quantity - abroadLocalPrice;

  return {
    ...item,
    abroadLocalPrice,
    savings,
  };
}

export async function getTrips({ userId }: { userId: User["id"] }) {
  const trips = await prisma.trip.findMany({
    where: { userId },
    include: {
      items: true,
    },
  });

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
        (total, item) => total + item.abroadLocalPrice,
        0
      ),
      totalLocal: items.reduce((total, item) => total + item.localPrice, 0),
      totalSavings:
        items.reduce((total, item) => total + item.savings, 0) -
        trip.ticketCost,
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
