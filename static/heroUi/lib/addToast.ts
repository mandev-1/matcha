/**
 * Adapter: maps v2 addToast({title, description, color}) to v3 toast.success/danger/warning(title, {description})
 */
import { toast } from "@heroui/react";

export interface AddToastOptions {
  title: string;
  description?: React.ReactNode;
  color?: "default" | "primary" | "success" | "warning" | "danger" | "accent";
}

export function addToast(options: AddToastOptions) {
  const { title, description, color = "default" } = options;

  const toastOptions = description ? { description } : {};

  switch (color) {
    case "success":
      toast.success(title, toastOptions);
      break;
    case "danger":
      toast.danger(title, toastOptions);
      break;
    case "warning":
      toast.warning(title, toastOptions);
      break;
    case "primary":
    case "accent":
      toast(title, { ...toastOptions, variant: "accent" });
      break;
    default:
      toast(title, toastOptions);
  }
}
