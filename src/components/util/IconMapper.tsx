import React from 'react';
import { IconType } from './icons.ts';
import { BookText, Building, Github, SquareArrowOutUpRight, UserRound, UsersRound } from 'lucide-react';

// 아이콘 매핑 객체
const IconMap: Record<IconType, JSX.Element> = {
    [IconType.PERSONAL]: <UserRound color='white'       className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>개인 프로젝트</title></UserRound>,
    [IconType.TEAM]: <UsersRound color='white'          className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>팀 프로젝트</title></UsersRound>,
    [IconType.COMPANY]: <Building color='white'         className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>회사 프로젝트</title></Building>,
    [IconType.GITHUB]: <Github color='white'            className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>깃허브 레포지토리</title></Github>,
    [IconType.BLOG_DOCUMENT]: <BookText color='white'   className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>도큐먼트</title></BookText>,
    [IconType.EXTERNAL]: <SquareArrowOutUpRight color='white'   className='bg-[#061529] px-0 py-1.5 rounded-full w-[36px] h-[36px]'><title>사이트 열기</title></SquareArrowOutUpRight>,
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

export const LinkedIn:React.FC<React.SVGProps<SVGSVGElement>> = ({ className }) => {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} data-supported-dps="24x24" fill="currentColor" focusable="false">
        <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"></path>
    </svg>
};