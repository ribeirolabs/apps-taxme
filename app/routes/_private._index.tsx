import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, NavLink, useLoaderData } from "@remix-run/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { numberFormat } from "~/lib/numberFormat";
import { cn } from "~/lib/utils";

import { getTrips } from "~/models/trip.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  const trips = await getTrips({ userId });
  return json({ trips });
};

export default function TripsPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <main className="min-h-screen h-full w-full max-w-[800px] mx-auto">
      {data.trips.length === 0 ? (
        <p className="p-4">No trips yet</p>
      ) : (
        <>
          <h1 className="font-bold text-2xl mb-2">Trips</h1>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Total Abroad</TableHead>
                  <TableHead className="text-right">Total Local</TableHead>
                  <TableHead className="text-right">Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.trips.map((trip, i) => (
                  <TableRow key={trip.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell key={trip.id}>
                      <Link
                        to={`/trips/${trip.id}`}
                        className="underline font-bold"
                      >
                        {trip.name}
                      </Link>
                      <div className="text-muted-foreground">
                        {trip.itemsCount} items
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {numberFormat(
                        trip.totalAbroadConverted,
                        trip.localCurrency
                      )}
                      <div className="text-xs text-muted-foreground">
                        {numberFormat(trip.totalAbroad, trip.abroadCurrency)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {numberFormat(trip.totalLocal, trip.localCurrency)}
                      <div className="text-xs text-muted-foreground">
                        {numberFormat(
                          trip.totalLocal / trip.abroadConversionRate,
                          trip.abroadCurrency
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        "font-bold text-right",
                        trip.totalSavings > 0
                          ? "text-positive"
                          : trip.totalSavings < 0
                          ? "text-destructive"
                          : null
                      )}
                    >
                      {numberFormat(trip.totalSavings, trip.localCurrency)}
                      <div className="text-xs opacity-60">
                        {numberFormat(
                          trip.totalSavings / trip.abroadConversionRate,
                          trip.abroadCurrency
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </main>
  );
}
