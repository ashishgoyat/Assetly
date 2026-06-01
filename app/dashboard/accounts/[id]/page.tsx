/**
 * Account detail page — thin Server Component wrapper.
 * Awaits dynamic route params and passes the id down to the Client Component.
 */

import AccountDetailClient from "./AccountDetailClient";

interface AccountPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { id } = await params;
  return <AccountDetailClient id={id} />;
}
