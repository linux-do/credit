import { type ReactNode } from "react";

export type PolicySection = {
  value: string;
  title: string;
  content: ReactNode;
  children?: {
    value: string;
    title: string;
  }[];
};
