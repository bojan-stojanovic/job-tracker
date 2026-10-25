import { repository } from "@/lib/repository";
import { getCurrentUserId } from "@/lib/auth";
import { Board } from "@/components/board/board";

export async function BoardContent() {
  const userId = await getCurrentUserId();
  const apps = await repository.list(userId);

  return <Board apps={apps} />;
}