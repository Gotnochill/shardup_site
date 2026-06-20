/* eslint-disable @next/next/no-img-element */

import { auth } from "../../auth";
import { prisma } from "../../lib/prisma";
import RsvpControl from "./rsvp-control";

export const dynamic = "force-dynamic";

function formatEventDate(startsAt: Date, endsAt: Date | null) {
  const starts = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(startsAt);

  if (!endsAt) {
    return starts;
  }

  const ends = new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone: "UTC",
  }).format(endsAt);

  return `${starts} - ${ends} UTC`;
}

export default async function EventsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const events = await prisma.event.findMany({
    where: {
      published: true,
      startsAt: { gte: new Date() },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      imageUrl: true,
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

  return (
    <main className="app-shell wide-card">
      <section className="app-card">
        <p className="section-label">Events</p>
        <h1>Upcoming ShardUp sessions.</h1>
        <p>
          Join community sessions, reading jams, and builder circles. RSVP is open
          to active ShardUp members.
        </p>

        <div className="event-list">
          {events.length > 0 ? (
            events.map((event) => {
              const isGoing = Boolean(event.rsvps && event.rsvps.length > 0);

              return (
                <article
                  className={event.imageUrl ? "event-card has-event-image" : "event-card"}
                  key={event.id}
                >
                  {event.imageUrl ? (
                    <a className="event-image-link" href={`/events/${event.id}`}>
                      <img className="event-image" src={event.imageUrl} alt="" />
                    </a>
                  ) : null}
                  <div>
                    <p className="event-meta">{formatEventDate(event.startsAt, event.endsAt)}</p>
                    <h2>
                      <a href={`/events/${event.id}`}>{event.title}</a>
                    </h2>
                    <p>{event.description}</p>
                    <p className="event-meta">
                      {event.location} · {event._count.rsvps} going
                    </p>
                  </div>
                  <div className="event-actions">
                    <RsvpControl
                      eventId={event.id}
                      userStatus={session?.user?.status}
                      isGoing={isGoing}
                    />
                    <a className="text-link" href={`/events/${event.id}`}>
                      Details
                    </a>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="form-message">No upcoming events are published yet.</div>
          )}
        </div>
      </section>
    </main>
  );
}
