import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="wrap"
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="prompt"><span className="dollar">$</span> cat page</div>
      <h1 style={{ fontSize: 42, color: "var(--heading)", margin: "8px 0" }}>404</h1>
      <p style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>
        No such file or directory.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">← back home</Link>
      </p>
    </main>
  );
}
