import { numberFormat } from "~/lib/numberFormat";
import { cn } from "~/lib/utils";

export function CurrencyValue({
  mainCurrency,
  mainValue,
  secondaryCurrency,
  secondaryValue,
  colorize,
}: {
  mainCurrency: string;
  mainValue: number;
  secondaryCurrency?: string;
  secondaryValue?: number;
  colorize?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-right",
        colorize && "font-bold",
        colorize && mainValue > 0 && "text-positive",
        colorize && mainValue < 0 && "text-destructive"
      )}
    >
      {numberFormat(mainValue, mainCurrency)}

      {secondaryValue && secondaryCurrency ? (
        <div className="text-xs opacity-60">
          {numberFormat(secondaryValue, secondaryCurrency)}
        </div>
      ) : null}
    </div>
  );
}
