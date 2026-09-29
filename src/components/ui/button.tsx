import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      primary: "bg-primary text-primary-foreground shadow-glow hover:bg-primary/90",
      secondary: "border border-border bg-secondary text-secondary-foreground hover:border-primary/60 hover:bg-accent",
      ghost: "text-muted-foreground hover:bg-accent hover:text-foreground",
      danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    },
    size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", lg: "h-12 px-6", icon: "size-10 px-0" },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({ className, variant, size, asChild, ...props }: Props) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
