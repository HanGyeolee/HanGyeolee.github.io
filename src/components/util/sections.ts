export interface GradientConfig {
  type: 'linear' | 'radial';
  colors: string[];
  stops?: number[]; // 0-1 사이의 값들
  direction?: 'top2bottom'; // 'to bottom', 'to right', '45deg' 등
}

export interface SectionProps {
    id: string;
    label?: string;
    invisible?: boolean;
    title?: string;
    colors?: string[];
}
export interface NavigationProps {
    sections?: SectionProps[];
    defaultTitle?: string;
}