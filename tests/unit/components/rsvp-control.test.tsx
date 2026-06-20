import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../app/events/actions", () => ({
  rsvpToEvent: vi.fn(),
  cancelEventRsvp: vi.fn(),
}));

import RsvpControl from "../../../app/events/rsvp-control";

describe("RsvpControl", () => {
  it("prompts logged-out visitors to sign in", () => {
    render(<RsvpControl eventId="e1" isGoing={false} />);

    const link = screen.getByRole("link", { name: "Sign in to RSVP" });
    expect(link).toHaveAttribute("href", "/join");
  });

  it("sends pending members to the application", () => {
    render(<RsvpControl eventId="e1" userStatus="PENDING" isGoing={false} />);

    const link = screen.getByRole("link", { name: "Membership pending" });
    expect(link).toHaveAttribute("href", "/apply");
  });

  it("blocks rejected/suspended members", () => {
    render(<RsvpControl eventId="e1" userStatus="REJECTED" isGoing={false} />);

    expect(screen.getByText("Only active members can RSVP.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("lets active members RSVP", () => {
    render(<RsvpControl eventId="e1" userStatus="ACTIVE" isGoing={false} />);

    expect(screen.getByRole("button", { name: "RSVP" })).toBeInTheDocument();
  });

  it("lets active members cancel an existing RSVP", () => {
    render(<RsvpControl eventId="e1" userStatus="ACTIVE" isGoing />);

    expect(screen.getByRole("button", { name: "Cancel RSVP" })).toBeInTheDocument();
  });
});
