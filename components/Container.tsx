import type { ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

const baseClasses =
  "mx-auto w-full max-w-[min(92vw,34rem)] px-4 sm:max-w-[min(88vw,40rem)] sm:px-6 md:max-w-[min(84vw,60rem)] md:px-10 lg:max-w-6xl lg:px-0";

const Container = ({ children, className = "" }: ContainerProps) => (
  <div className={`${baseClasses} ${className}`.trim()}>{children}</div>
);

export default Container;

