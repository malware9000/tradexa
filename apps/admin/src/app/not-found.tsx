import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="not-found">
      <h1>404</h1>
      <p>That page could not be found.</p>
      <Link href="/">
        <button>Back to Overview</button>
      </Link>
    </section>
  );
}
