import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "../../lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
 <SwitchPrimitives.Root
  className={cn(
    "peer inline-flex h-[28px] w-[56px] shrink-0 cursor-pointer items-center rounded-[14px] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#05c46b] data-[state=unchecked]:bg-[#ddd] shadow-[inset_0_0_0_2px_#ccc] data-[state=checked]:shadow-[inset_0_0_0_2px_#04b360]",
    className
  )}
  {...props}
  ref={ref}
>
  <SwitchPrimitives.Thumb
    className={cn(
      "pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.2)] transition-all duration-300 data-[state=checked]:translate-x-[32px] data-[state=unchecked]:translate-x-[4px] data-[state=checked]:shadow-[0_2px_5px_rgba(0,0,0,0.2),0_0_0_2px_#05c46b]"
    )}
  />
</SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
