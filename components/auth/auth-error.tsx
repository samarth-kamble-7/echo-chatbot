import React from "react";
import { AlertCircle } from "lucide-react";

export const AuthError = ({ message }: { message: string }) => {
  if (!message) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};
