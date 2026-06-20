import AccountBar from "../account-bar";

export default function EventsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AccountBar />
      {children}
    </>
  );
}
