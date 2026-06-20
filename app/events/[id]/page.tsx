import { notFound } from "next/navigation";
import { auth } from "../../../auth";
import { prisma } from "../../../lib/prisma";
import RsvpControl from "../rsvp-control";

export const dynamic = "force-dynamic";

function formatEventDate(startsAt: Date, endsAt: Date | null) {
  const starts = new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(startsAt);

  if (!endsAt) {
    return `${starts} UTC`;
  }

  const ends = new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone: "UTC",
  }).format(endsAt);

  return `${starts} - ${ends} UTC`;
}

export default async function EventDetailPage({
  params,
}: Readonly<{
  params: { id: string };
}>) {
  const session = await auth();
  const userId = session?.user?.id;
  const event = await prisma.event.findFirst({
    where: {
      id: params.id,
      published: true,
      startsAt: { gte: new Date() },
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startsAt: true,
      endsAt: true,
      rsvps: {
        where: { userId: userId ?? "" },
        select: { id: true },
      },
      _count: { select: { rsvps: true } },
    },
  });

  if (!event) {
    notFound();
  }

  const isGoing = Boolean(event.rsvps && event.rsvps.length > 0);

  return (
    <main className="app-shell">
      <section className="app-card">
        <p className="section-label">Event details</p>
        <h1>{event.title}</h1>
        <div className="event-detail-meta">
          <p>{formatEventDate(event.startsAt, event.endsAt)}</p>
          <p>{event.location}</p>
          <p>{event._count.rsvps} going</p>
        </div>
        <p>{event.description}</p>
        <div className="event-detail-actions">
          <RsvpControl
            eventId={event.id}
            userStatus={session?.user?.status}
            isGoing={isGoing}
          />
          <a className="text-link" href="/events">
            Back to events
          </a>
        </div>
      </section>
    </main>
  );
}
