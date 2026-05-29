export function PrismLogo({ className = 'h-16 w-16' }: { className?: string }) {
  return (
    <img
      src="/prism-logo.svg"
      alt="Prism"
      className={`${className} object-contain`}
    />
  );
}
