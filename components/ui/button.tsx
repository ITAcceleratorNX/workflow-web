import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--action-background))] text-[hsl(var(--action-foreground))] hover:brightness-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Product dark UI (Figma «workflow»): filled accent, raised neutral, destructive, outlined accent.
        accent: "bg-ui-accent text-ui-fg font-semibold hover:brightness-110 focus-visible:ring-ui-fg/70",
        raised: "bg-ui-raised text-ui-fg font-semibold hover:bg-ui-fg/[0.14] focus-visible:ring-ui-fg/70",
        danger: "bg-ui-danger text-ui-fg font-semibold hover:brightness-110 focus-visible:ring-ui-fg/70",
        "accent-outline": "border border-ui-accent text-ui-accent font-semibold hover:bg-ui-accent/10",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        /** Full-width action of a mobile screen or sheet: 50 px, radius 14, 17 px text. */
        block: "h-[50px] w-full rounded-[14px] px-4 text-[17px] [&_svg]:size-5",
        /** Window and toolbar actions: 42 px, radius 12, 15 px text. */
        md: "h-[42px] rounded-xl px-[22px] text-[15px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
