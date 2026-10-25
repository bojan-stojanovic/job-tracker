import { connection } from "next/server";
import { applicationsToCsv } from "@/lib/csv/csv";
import { getCurrentUserId } from "@/lib/auth";
import { repository } from "@/lib/repository";

export async function GET() {
  // Opts this handler out of prerendering, so each download reflects
  // the current data and the current user.
  await connection();

  const userId = await getCurrentUserId();
  const apps = await repository.list(userId);

  return new Response(applicationsToCsv(apps), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="applications.csv"',
    },
  });
}