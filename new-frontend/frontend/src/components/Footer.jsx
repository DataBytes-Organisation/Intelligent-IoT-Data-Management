export default function Footer({ note = "Built with React & Tailwind" }) {
  return (
    <footer className="border-t border-gray-200/70 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6 text-sm text-slate-500">
        © {new Date().getFullYear()} Intelligent IoT · {note}
      </div>
    </footer>
  );
}
