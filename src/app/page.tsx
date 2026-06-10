import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (user.status === "BANNED") redirect("/banned");
  redirect("/dashboard");
}
