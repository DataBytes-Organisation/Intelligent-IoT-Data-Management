function Thermometer(props){return(<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0Z" stroke="currentColor" strokeWidth="1.8"/><path d="M12 12v4.5" stroke="currentColor" strokeWidth="1.8"/></svg>)}
function Droplet(props){return(<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3s6 6.5 6 10a6 6 0 1 1-12 0c0-3.5 6-10 6-10Z" stroke="currentColor" strokeWidth="1.8"/></svg>)}
function Air(props){return(<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M3 8h11a3 3 0 1 0-3-3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 12h15a3 3 0 1 1-3 3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 16h6" stroke="currentColor" strokeWidth="1.8"/></svg>)}

const ICONS = {
  temperature: Thermometer,
  humidity: Droplet,
  air: Air,
};

export default function Icon({ name, className = "h-6 w-6" }) {
  const Comp = ICONS[name] || Air; // fallback generic
  return <Comp className={className} />;
}
