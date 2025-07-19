import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import IntroSection from '../../components/sections/Intro';
import AboutSection from '../../components/sections/About';
import SkillsSection from '../../components/sections/Skills';
import ProjectsSection from '../../components/sections/Projects';
import { Navigation, ScrollIndicator } from '../../components/ui';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollToPlugin);

const Home = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="relative bg-[#0E2F5E]">
      <Navigation sections={[
        { id: 'start', invisible: true, colors:["#BAD8FF"] },
        { id: 'intro', label: '짧은 소개', title: '제 이름은 최한결', colors:["#BAD8FF", "#17498B"] },
        { id: 'about', label: '자기 소개', title: '개발자 라고 하죠', colors:["#0E2F5E"] },
        { id: 'skills', label: '기술 스택', title: '풀스택 엔지니어 최한결', colors:["#081F41"] },
        { id: 'projects', label: '프로젝트', colors:["#061529", "#061529"] }
      ]} defaultTitle='저는 이런 사람입니다'/>
      <section id='start' className='h-[2px] bg-[#BAD8FF]'></section>

      <section id="intro">
        <IntroSection />
      </section>
      
      <section id="about">
        <AboutSection />
      </section>
      
      <section id="skills">
        <SkillsSection />
      </section>
      
      <section id="projects">
        <ProjectsSection />
      </section>

      {/* 스크롤 안내 */}
      <ScrollIndicator/>
    </div>
  );
};

export {Home};