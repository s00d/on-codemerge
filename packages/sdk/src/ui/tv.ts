import type { TV } from 'tailwind-variants';
import { tv as tvBase } from 'tailwind-variants';

/** Project tv wrapper — twMerge on by default. */
export const tv: TV = (options, config) =>
  tvBase(options, {
    ...config,
    twMerge: config?.twMerge ?? true,
  });
