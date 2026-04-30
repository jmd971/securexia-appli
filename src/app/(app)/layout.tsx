import { redirect } from "next/navigation";
import { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { getCurrentSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-muted-light">
      <Sidebar user={{ email: session.email, role: session.role }} />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
