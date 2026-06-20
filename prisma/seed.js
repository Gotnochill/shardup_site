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
