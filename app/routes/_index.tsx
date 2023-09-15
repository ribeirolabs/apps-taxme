import type { V2_MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";

import { useOptionalUser } from "~/utils";

export const meta: V2_MetaFunction = () => [{ title: "Remix Notes" }];

export default function Index() {
  const user = useOptionalUser();
  return (
    <main className="p-4">
      <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
        {user ? (
          <Button asChild>
            <Link to="/notes">View Notes for {user.email}</Link>
          </Button>
        ) : (
          <div className="space-y-4 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5 sm:space-y-0">
            <Button asChild>
              <Link to="/join">Sign up</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Log In</Link>
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
