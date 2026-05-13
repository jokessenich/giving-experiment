import { Masthead } from '@/components/Masthead';
import { Footer } from '@/components/Footer';
import { MUSHROOM_BATCHES } from '@/lib/wordlists';
import { StartForm } from './StartForm';

export const dynamic = 'force-dynamic';

export default function StartPage() {
  return (
    <div className="wrap form-page">
      <Masthead subtle />

      <h1>Start a <em>chain</em>.</h1>
      <div className="lede">— a small thing, sent out into the world.</div>

      <p className="intro">
        Put a few dollars in a package — or more, if you can — along with the small card
        we&apos;ll give you. Mail it to someone, or leave it where it might be found. Whoever
        opens it gets to choose: keep it if they need it, or add a little more and pass
        it on.
      </p>

      <StartForm batches={[...MUSHROOM_BATCHES]} />

      <Footer />
    </div>
  );
}
