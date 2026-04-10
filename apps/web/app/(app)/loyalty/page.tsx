import { redirect } from 'next/navigation';

/** Loyalty is not in the staging IA; keep route from bookmarks → overview */
export default function LoyaltyRedirectPage() {
  redirect('/overview');
}
