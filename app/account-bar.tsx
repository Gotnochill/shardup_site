import { auth, signOut } from "../auth";
import SiteHeader from "./site-header";

export default async function AccountBar() {
  const session = await auth();

  if (!session?.user) {
    return <SiteHeader />;
  }

  return (
    <SiteHeader>
      <a href="/dashboard">Dashboard</a>
      {session.user.role === "ADMIN" ? (
        <>
          <a href="/admin/cohort">Cohort</a>
          <a href="/admin/applications">Applications</a>
        </>
      ) : null}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button type="submit">Sign out</button>
      </form>
    </SiteHeader>
  );
}
