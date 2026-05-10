import { Masthead } from '@/components/Masthead';
import { Footer } from '@/components/Footer';
import { MUSHROOM_BATCHES } from '@/lib/wordlists';
import { StartForm } from './StartForm';

export const dynamic = 'force-dynamic';

export default function StartPage() {
  return (
    <div className="wrap form-page">
      <Masthead subtle />
      <a href="/" className="back">← back</a>

      <h1>Start a chain.</h1>
      <div className="lede">— a small thing, sent out into the world.</div>

      <p className="intro">
        Pick something to put in a package — money, art, a book, a kind letter. Fill in
        what you&apos;d like (everything is optional), and we&apos;ll give you back a small card to
        print and tuck inside. Then mail it to someone. Or leave it on a bench. The rest
        is up to whoever finds it.
      </p>

      <StartForm batches={[...MUSHROOM_BATCHES]} />

      <Footer />
    </div>
  );
}
