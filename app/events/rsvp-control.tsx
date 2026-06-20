import { UserStatus } from "@prisma/client";
import { cancelEventRsvp, rsvpToEvent } from "./actions";

type RsvpControlProps = {
  eventId: string;
  userStatus?: UserStatus;
  isGoing: boolean;
};

export default function RsvpControl({ eventId, userStatus, isGoing }: RsvpControlProps) {
  if (!userStatus) {
    return (
      <a className="button" href="/join">
        Sign in to RSVP
      </a>
    );
  }

  if (userStatus === UserStatus.PENDING) {
    return (
      <a className="secondary-button" href="/apply">
        Membership pending
      </a>
    );
  }

  if (userStatus !== UserStatus.ACTIVE) {
    return <p className="event-note">Only active members can RSVP.</p>;
  }

  return (
    <form action={isGoing ? cancelEventRsvp : rsvpToEvent} className="inline-form">
      <input type="hidden" name="eventId" value={eventId} />
      <button className={isGoing ? "secondary-button" : "button"} type="submit">
        {isGoing ? "Cancel RSVP" : "RSVP"}
      </button>
    </form>
  );
}
