import React from "react";

const APW = () => {
    document.title = "Android PDF Writer 라이브러리 webui";

    return (
        <div className="container mx-auto p-4">
            <header className="header">
            <div className="logo">AndroidPDFWriter 라이브러리 맛보기</div>
            <div className="controls">
                <button id="run-button" className="btn btn-primary">실행</button>
                <a href="https://github.com/HanGyeolee/AndroidPdfWriter/blob/main/README-ko.md#androidpdfwriter" className="btn btn-primary" target="_blank">GitHub</a>
            </div>
            </header>
        
            <div className="editor-container">
            <div className="editor-title">Java 코드</div>
            <div id="editor"></div>
            </div>
        
            <div className="preview-container">
            <div className="preview-title">PDF 미리보기</div>
            <div id="preview"></div>
            </div>
        </div>
    );
}

export {APW};