import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    thumbLabel?: string | string[]
  }
>(({ className, thumbLabel, ...props }, ref) => {
  const thumbCount = (props.value ?? props.defaultValue ?? [0]).length
  // D-2026-11-18-82: a thumb with no accessible name — the label
  // defaults to "Slider thumb" (numbered past the first) so a
  // consumer can also name each thumb explicitly.
  const labelForThumb = (i: number) =>
    Array.isArray(thumbLabel)
      ? (thumbLabel[i] ?? `Slider thumb ${i + 1}`)
      : (thumbLabel ?? (thumbCount > 1 ? `Slider thumb ${i + 1}` : "Slider thumb"))
  return (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    {Array.from({ length: thumbCount }, (_, i) => (
      <SliderPrimitive.Thumb
        key={i}
        aria-label={labelForThumb(i)}
        className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      />
    ))}
  </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
