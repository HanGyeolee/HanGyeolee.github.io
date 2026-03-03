import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const ProjectPage = lazy(() => import('./projectList.tsx'));
const Tonality = lazy(() => import('./tonality.tsx'));
const BlackHole = lazy(() => import('./blackhole.tsx'));
const APW = lazy(() => import('./apw.tsx'));

const HouseBarMenu = lazy(() => import('./housebarmenu.tsx'));
const HouseBarGuide = lazy(() => import('./housebarguide.tsx'));

const Projects = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route exact path="/" element={<ProjectPage/>}/>
                <Route path="/tonality" element={<Tonality/>}/>
                <Route path="/blackhole" element={<BlackHole/>}/>
                <Route path="/apw-webui" element={<APW/>}/>
                <Route path="/housebar/menu" element={<HouseBarMenu/>}/>
                <Route path="/housebar/guide" element={<HouseBarGuide/>}/>
            </Routes>
        </Suspense>
    );
}

export {Projects};