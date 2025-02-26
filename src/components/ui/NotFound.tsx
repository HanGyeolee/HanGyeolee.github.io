import React from "react";
import { Link } from "react-router-dom";

// src/pages/NotFound.js
const NotFound = () => {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl mb-8">페이지를 찾을 수 없습니다</p>
          <Link to="/" className="text-blue-500 hover:text-blue-700">
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    );
  };

export {NotFound};