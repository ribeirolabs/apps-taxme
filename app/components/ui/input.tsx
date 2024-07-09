import * as React from "react";

import { cn } from "~/lib/utils";
import { Label } from "./label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, helper, ...props }, ref) => {
    return (
      <div className="w-full">
        {label ? (
          <Label htmlFor={props.id} className="font-bold">
            {label}
          </Label>
        ) : null}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
        {helper ? (
          <Label
            htmlFor={props.id}
            className="block text-muted-foreground text-xs text-right"
          >
            {helper}
          </Label>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
