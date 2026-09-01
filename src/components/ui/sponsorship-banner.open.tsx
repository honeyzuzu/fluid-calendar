import { FaGithub } from "react-icons/fa";
import { HiHeart } from "react-icons/hi";

// Open source version of the sponsorship banner - shows GitHub sponsor link
export default function SponsorshipBanner() {
  return (
    <div className="flex items-center gap-2 border-t border-border bg-accent px-3 py-2.5">
      <FaGithub className="h-4 w-4 shrink-0 text-accent-foreground" />
      <span className="min-w-0 flex-1 text-xs font-medium leading-tight text-accent-foreground">
        Support the upstream project
      </span>
      <a
        href="https://github.com/sponsors/eibrahim"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-accent"
      >
        <HiHeart className="h-3.5 w-3.5" />
        Sponsor
      </a>
    </div>
  );
}
