import type { HTMLAttributes } from "react";
import clsx from "clsx";

export default function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "glass rounded-2xl shadow-xl shadow-black/20",
        className
      )}
      {...props}
    />
  );
}
