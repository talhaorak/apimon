export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 800, margin: "0 auto", padding: "4rem 2rem" }}>
      <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: "1rem" }}>
        ⚡ apimon
      </h1>
      <p style={{ fontSize: "1.25rem", color: "#666", marginBottom: "2rem" }}>
        CLI-first API Monitoring &amp; Alerting for developers who live in the terminal.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
        <FeatureCard
          title="CLI First"
          description="Add monitors, check status, manage alerts — all from your terminal."
        />
        <FeatureCard
          title="Real-time Alerts"
          description="Telegram, Slack, Discord, email, and webhook notifications."
        />
        <FeatureCard
          title="Status Pages"
          description="Beautiful public status pages for your users."
        />
      </div>

      <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <code style={{ fontSize: "0.9rem" }}>
          $ npx apimon check https://api.example.com/health
          <br />
          ✅ 200 OK — 142ms
        </code>
      </div>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ padding: "1.5rem", border: "1px solid #e5e5e5", borderRadius: "8px" }}>
      <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>{title}</h3>
      <p style={{ color: "#666", fontSize: "0.9rem" }}>{description}</p>
    </div>
  );
}
