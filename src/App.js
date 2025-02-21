import './App.css';
import {Suspense, useEffect, useRef} from 'react';
import { Route, Routes, useNavigate, redirect, useLocation, Navigate } from 'react-router-dom';
import { Home, APW } from './pages';
import {NotFound} from './components/ui/NotFound';

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route exact path="/" element={<Home/>}/>
        <Route path="/404" element={<NotFound/>}/>
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
