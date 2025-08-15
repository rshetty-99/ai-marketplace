import { redirect } from 'next/navigation'

export default function DashboardIndexPage() {
  // Redirect to the main dashboard page
  redirect('/dashboard')
}