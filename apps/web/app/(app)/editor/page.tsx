import { redirect } from 'next/navigation';

/** Bare `/editor` has no map id; send users to Maps to pick one. */
export default function EditorIndexPage() {
  redirect('/maps');
}
