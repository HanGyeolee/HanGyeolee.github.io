import './App.css';
import {Suspense} from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Home, Projects } from './pages';
import {NotFound} from './components/ui';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route exact path="/" element={<Home/>}/>
          <Route path="/projects/*" element={<Projects/>}/>
          <Route path="/404" element={<NotFound/>}/>
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
    </Suspense>
  );
}

export default App;
