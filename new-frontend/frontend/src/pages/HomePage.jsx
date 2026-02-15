export default function HomePage() {
  const cards = [
    {
      id: 1,
      title: "Sensor 1",
      desc: "Temperature & Humidity",
      href: "/dashboard?sensor=1",
      icon: "🌡️"
    },
    {
      id: 2,
      title: "Sensor 2",
      desc: "Air Quality (PM2.5/CO₂)",
      href: "/dashboard?sensor=2",
      icon: "🌬️"
    },
    {
      id: 3,
      title: "Sensor 3",
      desc: "Vibration & Noise",
      href: "/dashboard?sensor=3",
      icon: "📊"
    }
  ];

  return (
    <section>
      <h1 className="hero">IoT Sensors Dashboard</h1>
      <p className="hero-sub">Time-series sensor data & correlation analysis</p>

      <h3 className="section-title">Available Sensor Datasets</h3>
      <div className="grid">
        {cards.map((c) => (
          <a key={c.id} className="card" href={c.href}>
            <div className="card__icon">{c.icon}</div>
            <div className="card__body">
              <h4>{c.title}</h4>
              <p>{c.desc}</p>
            </div>
            <span className="card__cta">Open →</span>
          </a>
        ))}
      </div>
    </section>
  );
}
