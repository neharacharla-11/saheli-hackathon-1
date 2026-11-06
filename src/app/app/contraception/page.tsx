import { redirect } from "next/navigation";

/** Contraception now lives at /app/care (the first Care tab). */
export default function Page() {
  redirect("/app/care");
}
