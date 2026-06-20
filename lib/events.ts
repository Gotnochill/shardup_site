type DateStyle = "medium" | "full";

function formatRange(
  startsAt: Date,
  endsAt: Date | null,
  dateStyle: DateStyle,
  singleSuffix: string,
) {
  const starts = new Intl.DateTimeFormat("en", {
    dateStyle,
    timeStyle: "short",
    timeZone: "UTC",
  }).format(startsAt);

  if (!endsAt) {
    return singleSuffix ? `${starts}${singleSuffix}` : starts;
  }

  const ends = new Intl.DateTimeFormat("en", {
    timeStyle: "short",
    timeZone: "UTC",
  }).format(endsAt);

  return `${starts} - ${ends} UTC`;
}

// Compact form used in the events list cards.
export function formatEventListDate(startsAt: Date, endsAt: Date | null) {
  return formatRange(startsAt, endsAt, "medium", "");
}

// Full form used on the event detail page.
export function formatEventDetailDate(startsAt: Date, endsAt: Date | null) {
  return formatRange(startsAt, endsAt, "full", " UTC");
}
