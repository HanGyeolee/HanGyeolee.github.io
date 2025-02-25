import { IconType } from "./icons";

export interface ProjectProps {
  title: string;
  thumbnail?: JSX.Element;
  document?: string;
  type: IconType;
  description: string;
  techStack: string[];
  period: string;
}