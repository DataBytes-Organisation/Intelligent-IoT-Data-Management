export default function Section({ id, title, center = false, className = "", children }) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-6 ${className}`}>
      {title && (
        <h2 className={`${center ? "text-center" : ""} mb-8 text-2xl font-semibold`}>{title}</h2>
      )}
      {children}
    </section>
  );
}