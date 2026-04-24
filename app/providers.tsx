"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import {
  ThemeProvider as NextThemesProvider,
  ThemeProviderProps,
} from "next-themes";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

const UI = NextUIProvider as unknown as (props: {
  navigate: (path: string) => void;
  children: React.ReactNode;
}) => React.ReactElement;

const Theme = NextThemesProvider as unknown as (
  props: ThemeProviderProps & { children: React.ReactNode },
) => React.ReactElement;

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <UI navigate={router.push}>
      <Theme {...themeProps}>{children}</Theme>
    </UI>
  );
}
