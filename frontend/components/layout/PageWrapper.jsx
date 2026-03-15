import clsx from "clsx";

export default function PageWrapper({ children, className }) {
  return (
    <main className={clsx(
      "flex-1 overflow-y-auto p-4 sm:p-6 pb-8 animate-fade-in",
      className
    )}>
      {children}
    </main>
  );
}
