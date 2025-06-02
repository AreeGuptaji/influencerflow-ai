"use client";

import { useToast as useToastFromComponent } from "./toast";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  return useToastFromComponent();
}

export { ToastProvider } from "./toast";
