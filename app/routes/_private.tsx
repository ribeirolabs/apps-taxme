import {
  json,
  LoaderArgs,
  redirect,
  type V2_MetaFunction,
} from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { Header } from "~/components/header";
import { requireUserId } from "~/session.server";

export const meta: V2_MetaFunction = () => [
  { title: "Trip Savings - Ribeirolabs Apps" },
];

export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);
  if (!userId) return redirect("/");
  return json({});
};

export default function Index() {
  return (
    <>
      <Header />
      <main className="p-4">
        <Outlet />
      </main>
    </>
  );
}
