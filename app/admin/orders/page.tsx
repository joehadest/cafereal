import { redirect } from "next/navigation"

export default async function AdminOrdersPage() {
  // Redirect to the main orders page
  redirect("/orders")
}
