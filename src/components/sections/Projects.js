import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link } from 'react-router-dom';
import { IconType } from '../util/icons.ts';
import { DynamicIcon } from '../util/IconMapper.tsx';
import { ProjectList } from '../../pages/Projects/projectList.tsx';

const ProjectsSection = () => {
  const sectionRef = useRef(null);
  const projects = useRef(ProjectList);
  
  useEffect(() => {
    var ctx;
    const handleFullyLoaded  = () => {
      // 기존 컨텍스트가 있으면 정리
      if (ctx) {
        ctx.revert();
        ctx = null;
      }

      const Height = window.innerHeight;
      var projectHeight = (document.querySelector('.about-projects')?.getBoundingClientRect().height || Height);
      const element = document.querySelector('.section-content-wrapper');
      ctx = gsap.context(() => {
        const mainTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=696.428%`,
            pin: true,
            scrub: 1.5,
            onLeave: (self) => {
              // 메인 애니메이션이 완료되면 내부 스크롤 활성화
              gsap.set(element, { overflow: "auto" });
            },
            onEnterBack: (self) => {
              // 다시 메인 영역으로 돌아오면 내부 스크롤 비활성화
              gsap.set(element, { overflow: "hidden" });
              gsap.to(element, {
                scrollTop: 0,
                duration: 0.6, // 애니메이션 지속 시간(초)
                ease: "power2.out" // 이징 함수 (여러 옵션 중 선택 가능)
              });
            }
          }
        });
        projectHeight += 32;
        const titleHeight = gsap.getProperty('.section-title', 'height');
        const gapHeight = Height/2 - titleHeight/2;

        const stagger = 6 / projects.current.length * 0.75;

        // 애니메이션 시퀀스
        mainTl.fromTo(".title-header", {
          y: 50 + gapHeight,
          opacity: 0,
          duration: 0
        },
        {
          y: gapHeight,       // 끝 위치
          opacity: 1,
          duration: 2
        })
        .fromTo('.title-header-highlight', {
          y: -50 + gapHeight,
          opacity: 0,
          duration: 0
        },
        {
          y: gapHeight,       // 끝 위치
          opacity: 1,
          duration: 2
        }, "<")
        .from(".nothing", {
          opacity: 0,
          duration: 1,
        })
        .to([".title-header", '.title-header-highlight'], {
          y: 16,
          duration: 4
        })
        .from(".project-card", {
          y: gapHeight,
          opacity: 0,
          duration: 6,
          stagger
        }, `-=${ 1 - stagger}`);

        // 두 번째 타임라인: 내부 스크롤 효과를 위한 설정
        // 이 타임라인은 첫 번째 타임라인이 완료된 후 활성화됨
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: `+=400%`, // 첫 번째 애니메이션 완료 지점
            end: `+=${(projectHeight/Height) * 100}%`, // 추가 스크롤 범위
            scrub: true,
            pin: false, // 여기서는 핀 효과 없음
          }
        });

        // 내부 콘텐츠 스크롤 효과
        scrollTl.to(".projects-inner-content", {
          y: (projectHeight >= gapHeight * 2) ? gapHeight * 2 - projectHeight : 0, // 내부 콘텐츠를 위로 스크롤
          ease: "none",
          duration: projects.current.length
        });
      }, sectionRef);
    }
  
    // 디바운스 함수 - resize 이벤트 최적화
    const debounceResize = (func, delay) => {
      let timeoutId;
      return function(...args) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          func.apply(this, args);
        }, delay);
      };
    };

    // 디바운스된 리사이즈 핸들러
    const debouncedResize = debounceResize(handleFullyLoaded, 200);

    // 모든 리소스(이미지, 스타일시트 등)가 로드된 후
    if (document.readyState === 'complete') {
      // 이미 로드가 완료된 경우
      handleFullyLoaded();
    } else {
      // 아직 로드 중인 경우 이벤트 리스너 추가
      window.addEventListener('load', handleFullyLoaded);
    }

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('load', handleFullyLoaded);
      window.removeEventListener('resize', debouncedResize);
      if(ctx) ctx.revert();
    }
  }, []);

  return (
    <div ref={sectionRef} className="h-lvh bg-[#061529] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081F41] to-[#061529]"></div>

      {/* 추가된 래퍼 - 내부 스크롤용 */}
      <div className="section-content-wrapper h-full w-full overflow-hidden no-scrollbar">
        {/* 메인 컨텐츠 */}
        <div className="section-content projects-inner-content text-center z-10 max-w-5xl mx-auto px-4">
          <h1 className="section-title text-7xl text-white mb-6">
              <span className="title-header">이런&nbsp;</span>
              <span className='title-header-highlight font-bold'>프로젝트</span>
              <span className="title-header">를 했습니다.</span>
          </h1>

          <div className='about-projects grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-4'>
            {projects.current.map((project, index) => {
              const hasDocument = !!project.document;
              let isGithubLink = false;
              let isExternalLink = false;
              if(hasDocument) {
                isGithubLink = project.document.includes('github.com');
                isExternalLink = project.document.startsWith('https');
              }
              const CardContent = (
                <div className="aspect-[11/20] rounded-2xl overflow-hidden transition-colors duration-300 bg-white/15 hover:bg-white/20 ">
                  {/* 썸네일 이미지 */}
                  <div className="aspect-[1/1] relative overflow-hidden">
                    {project.thumbnail ? (
                      // 썸네일이 있는 경우
                      <img 
                        src={project.thumbnail} 
                        alt={project.title}
                        className="w-full h-full object-cover transition-scale duration-300 group-hover:scale-110"
                      />
                    ) : (
                      // 썸네일이 없는 경우
                      <div className="w-full h-full flex items-center justify-center bg-black/30">
                        <span className="text-white/50">No Image</span>
                      </div>
                    )}
                    {/* 타입 뱃지 */}
                    <div className="absolute bottom-4 right-4 flex">
                      <DynamicIcon type={project.type | (hasDocument?(isGithubLink?IconType.GITHUB:(isExternalLink?IconType.EXTERNAL:IconType.BLOG_DOCUMENT)):null)} className='ml-1' />
                    </div>
                  </div>

                  {/* 프로젝트 정보 */}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-white/80 text-sm min-h-[60px] mb-4 line-clamp-3" style={{whiteSpace:'pre-line'}}>
                      {project.description}
                    </p>
                    
                    {/* 기술 스택 */}
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span 
                          key={tech} 
                          className="bg-[#061529] px-2.5 py-1 rounded-full text-sm text-white/80"
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
              if(hasDocument) {
                return isExternalLink ? (
                  <a
                    key={index}
                    href={project.document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="project-card group relative"
                  >
                    {CardContent}
                  </a>
                ) : (
                  <Link
                    key={index}
                    to={`/projects/${project.document}`}
                    className="project-card group relative"
                  >
                    {CardContent}
                  </Link>
                );
              }
              return (
                <div key={index} className="project-card group relative">
                    {CardContent}
                </div>
              );
            })}
          </div>

          <div className='nothing'></div>
        </div>
      </div>
    </div>
  );
};

export default ProjectsSection;