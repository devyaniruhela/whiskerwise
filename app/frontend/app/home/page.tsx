import { redirect } from 'next/navigation';

/** /home is an alias of the root home page (Whiskerwise_PRD.md §3). */
export default function HomeAlias() {
  redirect('/');
}
