import { redirect } from 'next/navigation'

export default function RootPage() {
  // This will be handled by middleware to redirect to proper locale
  redirect('/en')
}