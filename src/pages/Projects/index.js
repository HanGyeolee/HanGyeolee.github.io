import { Suspense } from 'react';
import { Tonality } from './tonality.tsx';
import { Route, Routes } from 'react-router-dom';

function Projects() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <Routes>
                <Route path="tonality" element={<Tonality/>}/>
            </Routes>
        </Suspense>
    );
}

export {Projects};