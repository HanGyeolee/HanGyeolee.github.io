import { IconType } from "./icons.ts";

export interface ProjectProps {
  title: string;
  thumbnail?: JSX.Element;
  document?: string;
  type: IconType;
  description: string;
  techStack: string[];
  period: string;
}

export interface ContactLinkProps {
  title: string;
  href: string;
  type: JSX.Element;
}