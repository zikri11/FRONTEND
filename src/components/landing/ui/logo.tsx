import { Link } from "@tanstack/react-router";

const logo = "/images/egnet-favicon.svg";

export default function Logo() {
  return (
    <Link to="/" className="inline-flex shrink-0 items-center gap-2" aria-label="EgNET">
      <img src={logo} alt="EgNET Logo" width={32} height={32} />
      <span className="font-bold text-xl text-gray-900 tracking-tight">EgNET</span>
    </Link>
  );
}
