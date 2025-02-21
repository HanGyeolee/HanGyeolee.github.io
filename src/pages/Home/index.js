import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import IntroSection from '../../components/sections/Intro';
import AboutSection from '../../components/sections/About';
import SkillsSection from '../../components/sections/Skills';
import ProjectsSection from '../../components/sections/Projects';

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(ScrollToPlugin);

const Home = () => {
  const containerRef = useRef(null);

  return (
    <div ref={containerRef} className="relative bg-[#1B365D]">
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
    </div>
  );
};

export {Home};