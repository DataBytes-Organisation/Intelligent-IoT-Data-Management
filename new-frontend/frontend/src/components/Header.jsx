export default function Header({ brand = "Intelligent IoT", nav = [] }) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-grid h-7 w-7 place-items-center rounded bg-gradient-to-tr from-indigo-600 to-blue-500 text-white text-xs font-bold">
            IoT
          </span>
          <span className="text-base md:text-lg font-semibold tracking-wide">{brand}</span>
        </div>
        <nav className="hidden gap-6 text-sm md:flex">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className="hover:text-indigo-600">{n.label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}