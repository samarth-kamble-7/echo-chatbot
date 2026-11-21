import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="flex items-center justify-center min-h-75">
      <div className="text-xs font-mono text-zinc-400">Authenticating...</div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
