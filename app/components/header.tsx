import { Form, Link } from "@remix-run/react";
import { useUser } from "~/utils";
import { Button } from "./ui/button";

export function Header() {
  const user = useUser();

  return (
    <header className="flex items-center justify-between p-4 bg-secondary/20">
      <h1 className="font-bold font-mono text-sm">
        <Link to="/">ribeirolabs / trip savings</Link>
      </h1>

      <div className="flex gap-2 items-center">
        <p>{user.name}</p>
        <Form action="/logout" method="post">
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </Form>
      </div>
    </header>
  );
}
