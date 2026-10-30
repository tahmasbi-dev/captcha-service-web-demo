import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // In this demo, "logged in" is purely client-side, so without a real
  // session cookie the user could deep-link here. For now we just render
  // a landing page; wire this to real auth later.
  return (
    <main className="card">
      <h1>Welcome</h1>
      <p>You are signed in.</p>
    </main>
  );
}