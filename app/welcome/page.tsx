export default function Welcome() {
  return (
    <main
      className="bg-grain relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-20 text-center"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(188,86,46,0.14), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 15%, rgba(85,98,74,0.14), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, rgba(188,86,46,0.08), transparent 65%)",
      }}
    >
      <div
        className="anim-fadescale relative z-10 mx-auto w-full max-w-lg overflow-hidden rounded-[1.75rem] border border-line bg-paper p-10 shadow-[0_30px_70px_-30px_rgba(33,28,23,0.35)] sm:p-14"
        style={{ animationDelay: "0ms" }}
      >
        <div
          className="anim-fadeup mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-sage/30 bg-sage/10"
          style={{ animationDelay: "80ms" }}
        >
          <svg
            viewBox="0 0 20 20"
            className="h-6 w-6 text-sage-deep"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M4 10.5l3.5 3.5L16 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1
          className="anim-fadeup mt-6 text-3xl text-ink sm:text-4xl"
          style={{ animationDelay: "170ms" }}
        >
          You&apos;re in — welcome to StagingHub
        </h1>

        <p
          className="anim-fadeup mx-auto mt-5 max-w-md text-balance text-lg text-ink-soft"
          style={{ animationDelay: "260ms" }}
        >
          We&apos;re setting up your account now. Check your email in the
          next few minutes for a link to set your password and get started.
        </p>
      </div>
    </main>
  );
}
