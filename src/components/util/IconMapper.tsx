import React from 'react';
import { IconType } from './icons.tsx';
import { BookText, Building, Github, UserRound, UsersRound } from 'lucide-react';

// 아이콘 매핑 객체
const IconMap: Record<IconType, JSX.Element> = {
    [IconType.PERSONAL]: <UserRound color='white'       className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>개인 프로젝트</title></UserRound>,
    [IconType.TEAM]: <UsersRound color='white'          className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>팀 프로젝트</title></UsersRound>,
    [IconType.COMPANY]: <Building color='white'         className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>회사 프로젝트</title></Building>,
    [IconType.GITHUB]: <Github color='white'            className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>깃허브 레포지토리</title></Github>,
    [IconType.BLOG_DOCUMENT]: <BookText color='white'   className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>도큐먼트</title></BookText>,
};

interface IconProps {
    type: number;  // 비트 연산된 타입 값
    className?: string;
}

export const DynamicIcon: React.FC<IconProps> = ({ type, className }) => {
    // 포함된 모든 아이콘 타입 찾기
    const includedTypes = Object.values(IconType).filter(iconType => 
        typeof iconType === 'number' && (type & iconType) === iconType
    );

    return (<>
        {includedTypes.map((iconType) => {
            const originalElement = IconMap[iconType as IconType];
            // 기존 className이 있으면 합치고, 없으면 새 className만 사용
            const newClassName = originalElement.props.className
                ? `${originalElement.props.className} ${className}`
                : className;
                
            return React.cloneElement(
                originalElement,
                { 
                    ...originalElement.props,
                    className: newClassName
                }
            );
        })}
    </>);
};