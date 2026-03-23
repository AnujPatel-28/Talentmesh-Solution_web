import Link from "next/link";

type Props = {
  title: string;
  description: string;
};

export default function AdminSectionPlaceholder({ title, description }: Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          background: "#fff",
          border: "1px solid #dbe7f5",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#2563eb",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Admin Section
        </p>
        <h1 style={{ margin: "10px 0 12px", color: "#0f172a" }}>{title}</h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{description}</p>
        <Link
          href="/dashboard/admin"
          style={{
            display: "inline-block",
            marginTop: 20,
            color: "#2563eb",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
}
