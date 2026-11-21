"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

interface AuthInputProps extends React.ComponentProps<"input"> {
  label: string;
  id: string;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

export const AuthInput = ({
  label,
  id,
  icon,
  isPassword = false,
  className,
  ...props
}: AuthInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-zinc-300">
        {label}
      </Label>
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-zinc-500 pointer-events-none flex items-center justify-center">
            {icon}
          </div>
        )}
        <Input
          id={id}
          type={isPassword ? (showPassword ? "text" : "password") : props.type}
          className={cn(
            "h-10 text-xs bg-zinc-900/70 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus-visible:border-zinc-500 rounded-lg",
            icon && "pl-9",
            isPassword && "pr-9",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
