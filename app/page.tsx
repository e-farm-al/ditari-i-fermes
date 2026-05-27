import { redirect } from "next/navigation";

// Root "/" → always redirect to dashboard.
// Clerk middleware sends unauthenticated users to /login from there.
export default function RootPage() {
  redirect("/dashboard");
}
