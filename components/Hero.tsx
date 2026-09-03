export default function Hero() {
  return (
    <section
      id="top"
      className="bg-grain relative overflow-hidden border-b border-line/70"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 60% 50% at 15% 10%, rgba(188,86,46,0.14), transparent 60%), radial-gradient(ellipse 55% 45% at 90% 15%, rgba(85,98,74,0.14), transparent 60%), radial-gradient(ellipse 70% 60% at 50% 100%, rgba(188,86,46,0.08), transparent 65%)",
      }}
    >
      <div className="relative z-10 mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
        <div>
          <p
            className="anim-fadeup mb-6 inline-flex items-center gap-2 rounded-full border border-clay/30 bg-paper/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-clay-deep"
            style={{ animationDelay: "0ms" }}
          >
            Built for property staging businesses
          </p>

          <h1
            className="anim-fadeup text-[2.6rem] leading-[1.04] font-normal text-ink sm:text-[3.4rem] lg:text-[3.9rem]"
            style={{ animationDelay: "80ms" }}
          >
            Every sofa, lamp, and vase —{" "}
            <em className="text-clay-deep italic">accounted for</em>, every
            job.
          </h1>

          <p
            className="anim-fadeup mt-7 max-w-xl text-lg text-ink-soft sm:text-xl"
            style={{ animationDelay: "170ms" }}
          >
            StagingHub is the mobile inventory and job-allocation tool built
            for property stagers. Photograph a piece once, then allocate it
            to jobs with confidence — no more promising the same sofa to two
            clients in the same week.
          </p>

          <div
            className="anim-fadeup mt-10 flex flex-wrap items-center gap-5"
            style={{ animationDelay: "260ms" }}
          >
            <a
              href="#pricing"
              className="rounded-full bg-clay px-7 py-3.5 text-base font-semibold text-paper shadow-[0_10px_28px_-10px_rgba(156,68,35,0.6)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-clay-deep hover:shadow-[0_16px_34px_-10px_rgba(156,68,35,0.7)] active:translate-y-0"
            >
              Start your free trial
            </a>
            <span className="text-sm text-ink-soft">
              14-day free trial · No card required to start
            </span>
          </div>
        </div>

        <div
          className="anim-fadescale relative mx-auto w-full max-w-md lg:mx-0"
          style={{ animationDelay: "260ms", ["--tilt" as string]: "-2deg" }}
        >
          <div className="relative rotate-[-2deg] overflow-hidden rounded-[1.75rem] border border-line bg-paper p-3 shadow-[0_30px_60px_-20px_rgba(33,28,23,0.35)] transition-transform duration-500 ease-out hover:rotate-0">
            <img
              src="https://placehold.co/640x760/efe7d8/4a4238?text=Inventory+photo"
              alt="Example of a staging inventory item photographed in the app"
              className="w-full rounded-[1.35rem] object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 rotate-[3deg] rounded-2xl border border-line bg-paper px-5 py-4 shadow-[0_18px_36px_-14px_rgba(33,28,23,0.3)] sm:-left-10">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-sage-deep">
              Available for job
            </p>
            <p className="mt-1 font-display text-2xl text-ink">3 of 5 in stock</p>
          </div>
        </div>
      </div>
    </section>
  );
}
