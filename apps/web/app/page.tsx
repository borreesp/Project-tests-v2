import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Web scaffold</h1>
      <p className="text-sm text-muted-foreground">Selecciona una ruta base:</p>
      <div className="flex flex-wrap gap-2">
        <Link className="rounded bg-secondary px-3 py-2 text-sm" href="/login">
          /login
        </Link>
        <Link className="rounded bg-secondary px-3 py-2 text-sm" href="/register/invite">
          /register/invite
        </Link>
        <Link className="rounded bg-secondary px-3 py-2 text-sm" href="/athlete">
          /athlete
        </Link>
        <Link className="rounded bg-secondary px-3 py-2 text-sm" href="/coach">
          /coach
        </Link>
        <Link className="rounded bg-secondary px-3 py-2 text-sm" href="/admin">
          /admin
        </Link>
      </div>
    </section>
  );
}
