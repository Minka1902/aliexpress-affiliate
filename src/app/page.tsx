import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.status === "PENDING") redirect("/pending");
  if (user.status !== "APPROVED") redirect("/signin");
  redirect("/dashboard");
}
