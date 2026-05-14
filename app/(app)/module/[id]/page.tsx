import { notFound, redirect } from "next/navigation";

import { ModuleView } from "@/components/module/module-view";
import { createClient } from "@/lib/supabase/server";
import type { ModuleContent } from "@/lib/types/database";

interface Props {
  params: { id: string };
}

export default async function ModulePage({ params }: Props) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: module, error } = await supabase
    .from("modules")
    .select("id, title, content, status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !module || !module.content) notFound();

  return (
    <ModuleView
      moduleId={module.id}
      title={module.title ?? "Модуль"}
      content={module.content as ModuleContent}
      status={module.status}
    />
  );
}
