import { Link } from "react-router-dom";
import { LOGO_ALT, LOGO_SRC } from "@/config/brand";
import { SITE_NAME } from "@/config/seo";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  href?: string;
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
};

const nameClasses = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
};

export default function AppLogo({
  size = "md",
  showName = true,
  href,
  className,
}: AppLogoProps) {
  const content = (
    <>
      <img
        src={LOGO_SRC}
        alt={LOGO_ALT}
        className={cn(sizeClasses[size], "object-contain shrink-0")}
      />
      {showName && (
        <span className={cn("font-bold text-white tracking-tight", nameClasses[size])}>
          {SITE_NAME}
        </span>
      )}
    </>
  );

  const wrapperClass = cn("flex items-center gap-2.5 min-w-0", className);

  if (href) {
    return (
      <Link to={href} className={cn(wrapperClass, "hover:opacity-90 transition-opacity")}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
