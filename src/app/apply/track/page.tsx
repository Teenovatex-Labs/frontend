import { redirect } from "next/navigation";

// Older emails linked to /apply/track; the tracker is the portal at /apply.
export default function Track() {
  redirect("/apply");
}
