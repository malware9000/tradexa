import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="content not-found">
      <h1>404</h1>
      <p>That page could not be found.</p>
      <Link href="/">
        <button>Back to Home</button>
      </Link>
    </section>
  );
}