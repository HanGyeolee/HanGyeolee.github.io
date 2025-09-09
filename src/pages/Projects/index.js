import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Tonality } from './tonality.tsx';
import { BlackHole } from './blackhole.tsx';
import { APW } from './apw.tsx';
import { ProjectList } from './projectList.tsx';

function Projects() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="tonality" element={<Tonality/>}/>
                <Route path="blackhole" element={<BlackHole/>}/>
                <Route path="apw-webui" element={<APW/>}/>
            </Routes>
        </Suspense>
    );
}

export {Projects};