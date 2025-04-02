export interface SectionProps {
    id: string;
    label?: string;
    invisible?: boolean;
    title?: string;
}
export interface NavigationProps {
    sections?: SectionProps[];
    defaultTitle?: string;
}