import clsx from "clsx"
import { twMerge } from "tailwind-merge"

export const cx: typeof clsx = (...args) => twMerge(clsx(...args))
