const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function daysFromNow(days, hourUtc) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hourUtc, 0, 0, 0);
  return date;
}

async function main() {
  const events = [
    {
      title: "Introduction to Tensor Processing Units (TPUs)",
      description:
        "Deepak Singh, SWE 3 at Google and previously SDE 2 at Uber and Microsoft plus SDE Intern at Amazon, will introduce Tensor Processing Units, why they matter for modern machine learning workloads, how they differ from GPUs, and when builders should consider using them for training or inference.",
      location: "Online",
      startsAt: new Date("2026-06-22T17:30:00.000Z"),
      endsAt: new Date("2026-06-22T18:30:00.000Z"),
      published: true,
    },
    {
      title: "ShardUp Builders Circle",
      description:
        "A focused evening for members to share what they are building, get feedback, and find collaborators for the next sprint.",
      location: "Online",
      startsAt: daysFromNow(14, 15),
      endsAt: daysFromNow(14, 16),
      published: true,
    },
    {
      title: "System Design Reading Jam",
      description:
        "We will pick one real-world system design case, read the tradeoffs together, and map the architecture on a shared board.",
      location: "ShardUp Discord",
      startsAt: daysFromNow(22, 15),
      endsAt: daysFromNow(22, 16),
      published: true,
    },
  ];

  for (const event of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { title: event.title },
      select: { id: true },
    });

    if (existingEvent) {
      await prisma.event.update({
        where: { id: existingEvent.id },
        data: event,
      });
    } else {
      await prisma.event.create({ data: event });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
