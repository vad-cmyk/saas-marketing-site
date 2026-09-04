import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { getProposal } from '@/lib/proposal';
import { photoUrl } from '@/lib/supabase';

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const proposal = await getProposal(token);

  if (!proposal) {
    notFound();
  }

  const { organization, items, property_address, client_name, stage_date, notes } = proposal;

  // organization.brand_color (when set) drives every accent-colored element via
  // this custom property; the .accent-* utilities fall back to the house clay
  // tone when it's absent, so the page looks fully designed either way.
  const accentStyle = organization.brand_color
    ? ({ '--accent': organization.brand_color } as CSSProperties)
    : undefined;

  return (
    <main className="bg-grain relative min-h-screen overflow-hidden bg-cream" style={accentStyle}>
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-14 sm:px-10 lg:py-20">
        {/* Header */}
        <header className="anim-fadeup mb-14 flex items-center justify-between gap-6 border-b border-line pb-6 sm:mb-20">
          <div className="flex items-center gap-4">
            {organization.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-10 w-auto object-contain sm:h-12"
              />
            ) : (
              <div className="accent-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold text-paper sm:h-12 sm:w-12">
                {organization.name.charAt(0)}
              </div>
            )}
            <span className="text-lg font-medium tracking-tight text-ink sm:text-xl">
              {organization.name}
            </span>
          </div>
          <span className="accent-text hidden text-xs font-semibold tracking-[0.2em] uppercase sm:inline">
            Staging Proposal
          </span>
        </header>

        {/* Hero */}
        <section className="anim-fadeup mb-16 sm:mb-24" style={{ animationDelay: '0.08s' }}>
          <p className="accent-text mb-3 text-xs font-semibold tracking-[0.25em] uppercase">
            Prepared for your property
          </p>
          <h1 className="max-w-3xl font-display text-4xl leading-[1.08] font-medium tracking-tight text-ink italic sm:text-5xl lg:text-6xl">
            {property_address}
          </h1>

          {(client_name || stage_date) && (
            <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-soft">
              {client_name && (
                <span>
                  <span className="text-ink-soft/70">Prepared for </span>
                  <span className="font-medium text-ink">{client_name}</span>
                </span>
              )}
              {client_name && stage_date && (
                <span className="h-4 w-px bg-line" aria-hidden="true" />
              )}
              {stage_date && (
                <span>
                  <span className="text-ink-soft/70">Staging date </span>
                  <span className="font-medium text-ink">{stage_date}</span>
                </span>
              )}
            </div>
          )}

          {notes && (
            <p className="accent-border mt-8 max-w-2xl border-l-2 pl-5 font-display text-lg leading-relaxed text-ink-soft italic">
              &ldquo;{notes}&rdquo;
            </p>
          )}
        </section>

        {/* Items */}
        <section className="anim-fadeup mb-16 sm:mb-24" style={{ animationDelay: '0.16s' }}>
          <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-line pb-4">
            <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              The pieces
            </h2>
            <span className="text-xs font-semibold tracking-[0.2em] text-ink-soft uppercase">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-sm border border-dashed border-line bg-paper/60 px-8 py-16 text-center">
              <p className="font-display text-xl text-ink italic">
                The selection is being finalized
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Check back soon — pieces will appear here as they&rsquo;re confirmed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <article
                  key={i}
                  className="group overflow-hidden rounded-sm border border-line bg-paper shadow-[0_1px_2px_rgba(36,31,26,0.04),0_8px_24px_-12px_rgba(36,31,26,0.18)] transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(36,31,26,0.06),0_20px_40px_-16px_rgba(36,31,26,0.28)]"
                >
                  <div className="relative aspect-4/5 overflow-hidden bg-line/40">
                    {item.photos[0] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photoUrl(item.photos[0])}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent mix-blend-multiply" />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-sm text-ink-soft italic">
                        No photo yet
                      </div>
                    )}
                    {item.quantity > 1 && (
                      <span className="accent-bg absolute top-3 right-3 rounded-full px-2.5 py-1 text-xs font-semibold text-paper">
                        ×{item.quantity}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-lg font-medium text-ink">{item.name}</h3>
                    <p className="mt-1 text-sm tracking-wide text-ink-soft uppercase">
                      {item.category}
                      {item.colour ? ` · ${item.colour}` : ''}
                    </p>
                    {item.dimensions ? (
                      <p className="mt-2 text-xs text-ink-soft/80 tabular-nums">
                        {item.dimensions} cm
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        {(organization.contact_email || organization.contact_phone) && (
          <footer
            className="anim-fadeup border-t border-line pt-8"
            style={{ animationDelay: '0.24s' }}
          >
            <p className="text-sm text-ink-soft">
              Questions? Contact <span className="font-medium text-ink">{organization.name}</span>
              {organization.contact_email ? (
                <>
                  {' '}
                  at{' '}
                  <a
                    href={`mailto:${organization.contact_email}`}
                    className="accent-text underline decoration-line underline-offset-4 transition-colors hover:decoration-current"
                  >
                    {organization.contact_email}
                  </a>
                </>
              ) : (
                ''
              )}
              {organization.contact_phone ? (
                <>
                  {' '}
                  {organization.contact_email ? 'or' : 'at'}{' '}
                  <a
                    href={`tel:${organization.contact_phone}`}
                    className="accent-text underline decoration-line underline-offset-4 transition-colors hover:decoration-current"
                  >
                    {organization.contact_phone}
                  </a>
                </>
              ) : (
                ''
              )}
              .
            </p>
          </footer>
        )}
      </div>
    </main>
  );
}
