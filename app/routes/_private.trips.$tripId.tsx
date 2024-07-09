import { Prisma, Trip, TripProduct } from "@prisma/client";
import type { ActionArgs, LoaderArgs, SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  isRouteErrorResponse,
  useActionData,
  useLoaderData,
  useNavigation,
  useRouteError,
  useSubmit,
} from "@remix-run/react";
import { FormEvent, useEffect } from "react";
import invariant from "tiny-invariant";
import { CurrencyValue } from "~/components/currency-value";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "~/components/ui/table";
import { numberFormat } from "~/lib/numberFormat";
import { omit } from "~/lib/omit";
import { useForm } from "~/lib/useForm";

import {
  TripProductWithSummary,
  TripWithProducts,
  calculateTripSummary,
  getTrip,
  updateTrip,
} from "~/models/trip.server";
import { requireUserId } from "~/session.server";

export const loader = async ({ params, request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  invariant(params.tripId, "tripId not found");

  const trip = await getTrip({ id: params.tripId, userId });
  if (!trip) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ trip: calculateTripSummary(trip) });
};

export const action = async ({ params, request }: ActionArgs) => {
  const userId = await requireUserId(request);
  invariant(params.tripId, "tripId not found");

  const data = (await request.json()) as any as {
    [x in keyof Prisma.TripUpdateWithoutProductsInput]: string;
  } & {
    products: Record<string, [number, number]>;
  };
  // const data = Object.fromEntries(await request.formData()) as any as {
  //   [x in keyof Prisma.TripUpdateWithoutProductsInput]: string;
  // } & {
  //   products: Record<string, [number, number]>;
  // };

  console.log(data);

  const trip = await updateTrip({
    id: params.tripId,
    userId,
    data: {
      id: data.id,
      name: data.name,
      abroadCurrency: data.abroadCurrency,
      ticketCost: data.ticketCost ? parseFloat(data.ticketCost) : undefined,
      localCurrency: data.localCurrency,
      abroadTaxPercentage: data.abroadTaxPercentage
        ? parseFloat(data.abroadTaxPercentage)
        : undefined,
      abroadConversionRate: data.abroadConversionRate
        ? parseFloat(data.abroadConversionRate)
        : undefined,
      products: data.products,
    },
  });

  return { ok: true, data: calculateTripSummary(trip) };
};

function tripForm(trip: SerializeFrom<TripWithProducts>) {
  const form = omit(trip, ["userId", "products", "createdAt", "updatedAt"]);

  return {
    ...form,
    products: trip.products.reduce(
      (acc, product) => {
        acc[product.id] = [product.abroadPrice, product.localPrice];
        return acc;
      },
      {} as Record<string, [number, number]>
    ),
  };
}

export default function TripDetailsPage() {
  const { trip } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const data = useActionData<typeof action>();

  useEffect(() => {
    if (data?.ok) {
      reset(tripForm(data.data));
    }
  }, [data]);

  const { values, change, reset, hasChanged } = useForm({
    initial: tripForm(trip),
  });

  console.log({ values });

  function onBlur(e: FormEvent) {
    const target = e.target as HTMLElement & EventTarget;

    if (/input|select|textarea/i.test(target.nodeName) && hasChanged()) {
      submit(
        values,
        // { ...values, products: JSON.stringify(values.products) },
        { replace: true, method: "post", encType: "application/json" }
      );
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto grid grid-cols-[1fr_30%] gap-2">
      <Form method="post" onBlur={onBlur}>
        <header className="flex items-center gap-2 w-full mb-4">
          <Input
            type="text"
            value={values.name}
            onChange={(e) => change("name", e.target.value)}
            name="name"
            placeholder="Name"
            className="text-2xl font-bold"
            helper={
              navigation.state !== "idle"
                ? "Loading..."
                : data?.ok
                ? "Saved"
                : "-"
            }
          />
        </header>

        <div className="flex flex-col w-full justify-between items-start gap-4">
          <div className="text-lg text-muted-foreground border-b w-full">
            Local
          </div>

          <div className="flex gap-2">
            <Input
              label="Currency"
              type="text"
              name="localCurrency"
              value={values.localCurrency}
              onChange={(e) => change("localCurrency", e.target.value)}
            />

            <Input
              label="Ticket"
              type="number"
              name="ticketCost"
              value={values.ticketCost}
              onChange={(e) => change("ticketCost", parseFloat(e.target.value))}
              helper={numberFormat(values.ticketCost ?? 0, trip.localCurrency)}
            />
          </div>

          <div className="text-lg text-muted-foreground border-b w-full">
            Abroad
          </div>

          <div className="flex gap-2">
            <Input
              label="Currency"
              type="text"
              name="abroadCurrency"
              value={values.abroadCurrency}
              onChange={(e) => change("abroadCurrency", e.target.value)}
            />

            <Input
              label="Tax %"
              type="number"
              name="abroadTaxPercentage"
              value={values.abroadTaxPercentage}
              onChange={(e) =>
                change("abroadTaxPercentage", parseFloat(e.target.value))
              }
            />

            <Input
              label="Conversion Rate"
              type="number"
              name="abroadConversionRate"
              value={values.abroadConversionRate}
              onChange={(e) =>
                change("abroadConversionRate", parseFloat(e.target.value))
              }
            />
          </div>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price Abroad</TableHead>
                <TableHead className="text-right">Price Local</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trip.products.map((product, i) => (
                <ProductForm
                  key={product.id}
                  trip={trip}
                  i={i + 1}
                  product={product}
                  onChange={(prices) =>
                    change("products", {
                      ...values.products,
                      [product.id]: prices,
                    })
                  }
                  values={values.products[product.id]}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </Form>

      <aside className="text-right flex flex-col gap-4">
        <div>
          <h2 className="font-bold text-lg">Total Abroad</h2>
          <CurrencyValue
            mainValue={trip.totalAbroadConverted}
            mainCurrency={trip.localCurrency}
            secondaryValue={trip.totalAbroad}
            secondaryCurrency={trip.abroadCurrency}
          />
        </div>
        <div>
          <h2 className="font-bold text-lg">Total Local</h2>
          <CurrencyValue
            mainValue={trip.totalLocal}
            mainCurrency={trip.localCurrency}
            secondaryValue={trip.totalLocalConverted}
            secondaryCurrency={trip.abroadCurrency}
          />
        </div>
        <div>
          <h2 className="font-bold text-lg">Savings</h2>
          <CurrencyValue
            mainValue={trip.totalSavings}
            mainCurrency={trip.localCurrency}
            secondaryValue={trip.totalSavingsConverted}
            secondaryCurrency={trip.abroadCurrency}
            colorize
          />
        </div>
      </aside>
    </div>
  );
}

function ProductForm({
  trip,
  product,
  i,
  onChange,
  values,
}: {
  trip: SerializeFrom<Trip>;
  product: SerializeFrom<TripProductWithSummary>;
  i: number;
  onChange: (values: [number, number]) => void;
  values: [number, number];
}) {
  return (
    <TableRow key={product.id}>
      <TableCell>{i}</TableCell>
      <TableCell>{product.name}</TableCell>
      <TableCell className="text-right">{product.quantity}</TableCell>
      <TableCell>
        <Input
          name={``}
          type="number"
          value={values[0]}
          onChange={(e) =>
            onChange([parseFloat(e.target.value ?? 0), values[1]])
          }
          helper={numberFormat(
            product.abroadPriceConverted,
            trip.localCurrency
          )}
        />
      </TableCell>
      <TableCell>
        <Input
          name={``}
          type="number"
          value={values[1]}
          onChange={(e) =>
            onChange([values[0], parseFloat(e.target.value ?? 0)])
          }
          helper={numberFormat(
            product.localPriceConverted,
            trip.abroadCurrency
          )}
        />
      </TableCell>
    </TableRow>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (error instanceof Error) {
    return <div>An unexpected error occurred: {error.message}</div>;
  }

  if (!isRouteErrorResponse(error)) {
    return <h1>Unknown Error</h1>;
  }

  if (error.status === 404) {
    return <div>Trip not found</div>;
  }

  return <div>An unexpected error occurred: {error.statusText}</div>;
}
