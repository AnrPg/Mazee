"use client"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type * as React from "react"

type Props = React.ComponentProps<typeof NextThemesProvider>
export function ThemeProvider({ children, ...props }: Props) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
