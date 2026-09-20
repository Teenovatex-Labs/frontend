export default function Join() {
  return (
    <section id="join" className="bg-yellow py-24 md:py-32">
      <div className="wrap flex flex-col items-center text-center">
        <h2 className="max-w-2xl text-4xl md:text-5xl">Ready when you are.</h2>
        <p className="mt-4 max-w-md text-muted">
          Join the WhatsApp community and start building with people who get it.
        </p>

        <a
          href="https://wa.me/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-sm font-semibold text-cream transition-transform hover:scale-105"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5 fill-cream"
          >
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.51 3.63 1.4 5.13L2 22l5.13-1.5a9.9 9.9 0 0 0 4.91 1.31h.01c5.46 0 9.91-4.45 9.91-9.9C21.96 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.42 1.3-1.94 1.36-.5.06-1 .09-1.62-.1-.37-.11-.85-.28-1.47-.55-2.58-1.12-4.26-3.7-4.4-3.88-.13-.18-1.05-1.4-1.05-2.67s.66-1.9.9-2.15c.24-.26.52-.32.7-.32.18 0 .35 0 .5.01.16.01.38-.06.6.46.24.56.79 1.94.86 2.08.06.14.1.31.02.5-.08.18-.13.3-.26.46-.13.15-.27.34-.39.46-.13.13-.26.27-.11.53.15.27.68 1.13 1.46 1.83.99.89 1.83 1.17 2.11 1.3.28.13.44.11.6-.06.16-.18.68-.79.86-1.06.18-.28.36-.23.6-.14.24.09 1.53.72 1.79.85.26.14.44.2.5.32.06.13.06.72-.18 1.4Z" />
          </svg>
          Join on WhatsApp
        </a>
      </div>
    </section>
  );
}
