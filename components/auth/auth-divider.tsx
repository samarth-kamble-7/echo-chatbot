import React from "react";

export const AuthDivider = ({ label = "or" }: { label?: string }) => {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-zinc-800" />
      </div>
      <div className="relative bg-[#0c0c0e] px-3 text-[11px] text-zinc-500 font-medium uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};
