import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { IconType } from '../util/icons.tsx';
import { DynamicIcon } from '../util/IconMapper.tsx';
import { ResponsiveContainer } from '../ui/ResponsiveContainer.js';

const ProjectsSection = () => {
  const sectionRef = useRef(null);

  const projects = useRef([
    {
      slug: 'https://github.com/HanGyeolee/AndroidPdfWriter',
      title: 'Android PDF Library',
      thumbnail: '/images/projects/android-pdf-writer.jpg',
      type: IconType.GITHUB,
      description: 'PDF1.4 기반 바이너리 파일 작성 라이브러리 배포',
      techStack: ['Android', 'Java', 'Library', 'PDF', 'Binary'],
      period: '2024.11 ~'
    },
    {
      slug: 'medical-platform',
      title: '의료 헬스케어 멀티 플랫폼',
      thumbnail: '/images/projects/medical-platform.jpg',
      type: IconType.COMPANY | IconType.BLOG_DOCUMENT,
      description: '생체 신호 기반 의료 헬스케어 멀티 플랫폼 안드로이드 개발 및 런칭',
      techStack: ['Android', 'Java', 'MVVM', 'JNI', 'SIMD', 'DataBinding'],
      period: '2022.06 ~ 2023.08'
    },
    {
      slug: 'music-app',
      title: '음악 동아리 어플리케이션',
      thumbnail: '/images/projects/music-app.jpg',
      type: IconType.BLOG_DOCUMENT,
      description: '크로스 플랫폼 음악 동아리 앱 개발 및 배포',
      techStack: ['Xamarin', 'C#', 'Firebase', 'Android', 'iOS'],
      period: '2019.01 - 2019.09'
    },
    // ... 더 많은 프로젝트
  ].sort((a, b) => b.period.localeCompare(a.period)));
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const Height = window.innerHeight;
      const projectHeight = document.querySelector('.about-projects')?.getBoundingClientRect().height || 0;
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: `+=${(3 + projectHeight/Height) * 100}%`,
          pin: true,
          scrub: 1.5
        }
      });
      const titleHalfHeight = gsap.getProperty('.section-title', 'height');
      const gapHeight = Height/2 - titleHalfHeight/2;
      console.log(`${gapHeight} = ${Height/2} - ${titleHalfHeight}`)

      const stagger = 0.75;

      // 애니메이션 시퀀스
      tl.fromTo(".title-header", {
        y: 50 + gapHeight,
        opacity: 0,
        duration: 0
      },
      {
        y: gapHeight,       // 끝 위치
        opacity: 1,
        duration: 1
      })
      .fromTo('.title-header-highlight', {
        y: -50 + gapHeight,
        opacity: 0,
        duration: 0
      },
      {
        y: gapHeight,       // 끝 위치
        opacity: 1,
        duration: 1
      }, "<")
      .from(".nothing", {
        opacity: 0,
        duration: 0.25,
      })
      .to([".title-header", '.title-header-highlight'], {
        y: 16,
        duration: 1
      })
      .from(".project-card", {
        y: gapHeight,
        opacity: 0,
        duration: projects.current.length,
        stagger
      }, `-=${ 1 - stagger}`)
      .from(".nothing", {
        opacity:0,
        duration: stagger,
      }, `-=${projects.current.length - 3 * stagger}`)
      .to(".section-content", {
        y:(projectHeight > Height) ? Height - projectHeight : 0,
        duration: projects.current.length / 3,
      }, `<`);
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-dvh bg-[#1B365D] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F2342] to-[#061529]"></div>

      {/* 메인 컨텐츠 */}
      <div className="section-content h-full text-center z-10 max-w-5xl mx-auto px-4">
          <h1 className="section-title text-7xl text-white mb-6">
              <span className="title-header">이런&nbsp;</span>
              <span className='title-header-highlight font-bold'>프로젝트</span>
              <span className="title-header">를 했습니다.</span>
          </h1>

        <div className='about-projects grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-4'>
          {projects.current.map((project, index) => {
            const isExternalLink = project.slug.startsWith('http');

            const CardContent = (
              <div className="aspect-[11/20] rounded-2xl overflow-hidden bg-white/20 transition-all duration-300 hover:bg-white/20">
                {/* 썸네일 이미지 */}
                <div className="aspect-[1/1] relative overflow-hidden">
                  <img 
                    src={project.thumbnail} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* 타입 뱃지 */}
                  <div className="absolute bottom-4 right-4 flex">
                    <DynamicIcon type={project.type} />
                  </div>
                </div>

                {/* 프로젝트 정보 */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                  <p className="text-white/80 text-sm min-h-[40px] mb-4 line-clamp-2">
                    {project.description}
                  </p>
                  
                  {/* 기술 스택 */}
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span 
                        key={tech} 
                        className="bg-[#061529] px-2 py-1 rounded-full text-xs text-white/80"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* 기간 */}
                  <div className="absolute bottom-0 left-0 p-4 w-full text-xs text-white/70 ">
                    {project.period}
                  </div>
                </div>
              </div>
            );

            return isExternalLink ? (
              <a
                key={index}
                href={project.slug}
                target="_blank"
                rel="noopener noreferrer"
                className="project-card group relative"
              >
                {CardContent}
              </a>
            ) : (
              <Link
                key={index}
                to={`/projects/${project.slug}`}
                className="project-card group relative"
              >
                {CardContent}
              </Link>
            );
          })}
        </div>

        <div className='nothing'></div>
      </div>
      
      {/* 스크롤 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce">
        <p className="text-sm tracking-widest">SCROLL</p>
      </div>
    </div>
  );
};

export default ProjectsSection;