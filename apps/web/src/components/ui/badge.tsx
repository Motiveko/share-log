import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@web/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        expense: "bg-red-100 text-red-700",
        income: "bg-green-100 text-green-700",
        success: "bg-green-100 text-green-700",
        warning: "bg-yellow-100 text-yellow-700",
        info: "bg-blue-100 text-blue-700",
        muted: "bg-muted text-muted-foreground",
      },
      shape: {
        default: "rounded",
        pill: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({
  className,
  variant,
  shape,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, shape }), className)} {...props} />
  );
}
