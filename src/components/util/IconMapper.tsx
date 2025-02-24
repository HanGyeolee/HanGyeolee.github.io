import React from 'react';
import { IconType } from './icons.tsx';
import { BookText, Building, Github, User,  } from 'lucide-react';

// 아이콘 매핑 객체
const IconMap: Record<IconType, JSX.Element> = {
    [IconType.GITHUB]: <Github color='white'/>,
    [IconType.PERSONAL]: <User color='white'/>,
    [IconType.COMPANY]: <Building color='white'/>,
    [IconType.BLOG_DOCUMENT]: <BookText color='white'/>,
};

interface IconProps {
    type: number;  // 비트 연산된 타입 값
}

export const DynamicIcon: React.FC<IconProps> = ({ type }) => {
    // 포함된 모든 아이콘 타입 찾기
    const includedTypes = Object.values(IconType).filter(iconType => 
        typeof iconType === 'number' && (type & iconType) === iconType
    );

    return (<>
        {includedTypes.map((iconType) => (
            React.cloneElement(IconMap[iconType as IconType])
        ))}
    </>);
};