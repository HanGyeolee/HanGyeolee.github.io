import React, { useEffect, useRef, useState } from "react";
import './apw.css';
import { FileUploader, getFilesFromIndexedDB, storeFilesInIndexedDB } from '../../components/util/APWLIB/FileUploader.tsx';
import { IndentationTracker } from "../../components/util/APWLIB/IndentationTracker.tsx";
import { LibraryProps, PaperUnit, RawFiles } from "../../components/util/APWLIB/enum.tsx";
import { Github } from 'lucide-react';

import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { languages, editor } from 'monaco-editor';

import { codeMapping, pdfLibraryClasses } from "../../components/util/APWLIB/CodeMapper.tsx";
import { PDFBuilder } from "../../components/util/APWLIB/PDFBuilder.tsx";
import { RectF } from "../../components/util/APWLIB/PDFPageLayout.tsx";
import { preloadFiles } from "../../components/util/APWLIB/PDFResource.tsx";
import { TitleMap, useAutoDocumentTitle } from "../../components/util/language.ts";
import { provideJavaCompletions } from "../../components/util/APWLIB/Completion.tsx";

const titles: TitleMap = {
  ko : '안드로이드 PDF Writer 라이브러리 webui',
  en : 'Android PDF Writer Library webui'
}

const APW = () => {
    const { detectedLanguage, appliedTitle } = useAutoDocumentTitle(titles);
    const [monaco, setMonaco] = useState<Monaco>();
    const [uploadedFiles, setUploadedFiles] = useState<RawFiles>({
        file: [],
        assets: [],
        resource: []
    });

    // 기본 Java 코드 예시
    const defaultJavaCode = 
    `PDFBuilder builder = new PDFBuilder(
    PageLayoutFactory.createLayout(Paper.A4, 10, 10)
); PDFLayout root = 
    PDFLinearLayout.build(Orientation.Vertical)
    .setBackgroundColor(Color.BLUE)
    .addChild(PDFImage.fromResource(context, R.id.testImage)
        .setCompress(true)
        .setHeight(200)
        .setFit(Fit.CONTAIN))
    .addChild(PDFH1.build("Title")
        .setFontFromAsset(context, "test-font.ttf")
        .setBackgroundColor(Color.RED)
        .setTextAlign(TextAlign.Center));
builder.draw(root);`;

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // 자동완성 제공자 등록
        monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters:['.','=','(',',',' '],
            provideCompletionItems: async function(model, position, context, token) {
                const files = await getFilesFromIndexedDB()
                const IdLibrary:LibraryProps = {
                    type:'Enum',
                    object: null,
                    name:'ResourceId',
                    variables: [
                        ...files.resource.map(file => {
                            return {
                                name: file.name.replace('R.id.',''),
                                isStatic:true,
                                type:'int'
                            }
                        })
                    ]
                }
                return provideJavaCompletions(model, position, [...pdfLibraryClasses,IdLibrary]);
            }
        });
        
        // 보호할 라인 내용
        const protectedContents = [
          'PDFBuilder builder = new PDFBuilder(', 
          '); PDFLayout root = ', 
          'builder.draw(root)'
        ];

        const model = editor.getModel();
        const tracker = new IndentationTracker();

        // 보호된 라인의 원본 내용 저장
        const protectedLinesContent = new Map<number, string>();
        
        // 재귀 호출 방지 플래그
        let isRestoring = false;
        if(model){
            // Initialize tracker with current content
            for (let i = 1; i <= model.getLineCount(); i++) {
                tracker.updateLine(model.getLineContent(i), i);
            }
  
            // Listen for content changes to update the tracker
            model.onDidChangeContent((event) => {
                tracker.handleModelContentChanged(event, model);
            
                // 복원 중이면 추가 처리 건너뛰기
                if (isRestoring) return;

                try {
                // 변경된 라인 확인
                let needsRestore = false;
                const changedLines:number[] = [];
                
                for (const change of event.changes) {
                    for (let line = change.range.startLineNumber; line <= change.range.endLineNumber; line++) {
                        changedLines.push(line);
                    }
                }
                
                // 현재 내용 가져오기
                const currentLines = model.getValue().split('\n');
                
                // 보호된 라인이 변경되었는지 확인
                for (const [lineNum, originalContent] of protectedLinesContent.entries()) {
                    if (changedLines.includes(lineNum) && lineNum <= currentLines.length) {
                        const currentLine = currentLines[lineNum - 1];
                        if (currentLine !== originalContent) {
                            currentLines[lineNum - 1] = originalContent;
                            needsRestore = true;
                        }
                    }
                }
                
                // 내용 복원이 필요하면 실행
                if (needsRestore) {
                    isRestoring = true;
                    const position = editor.getPosition();
                    model.setValue(currentLines.join('\n'));
                    if (position) editor.setPosition(position);
                }
                } finally {
                    // 비동기적으로 플래그 해제
                    setTimeout(() => {
                        updateProtectedLinesContent();
                        updateDecorations();
                        isRestoring = false;
                    }, 0);
                }
            });
  
            // DOM에서 제안 위젯 상태 확인하는 함수
            function checkSuggestionWidgetVisibility() {
              const editorNode = editor.getDomNode();
              if (editorNode) {
                const suggestWidget = editorNode.querySelector('.suggest-widget');
                return suggestWidget && !suggestWidget.classList.contains('hidden');
              }
              return false;
            }
            // 보호된 라인 내용 업데이트 함수
            function updateProtectedLinesContent() {
                if(model){
                    const lines = model.getValue().split('\n');
                    
                    // 기존 맵 초기화
                    protectedLinesContent.clear();
                    
                    // 새로운 보호된 라인 정보 설정
                    lines.forEach((line, index) => {
                        if (protectedContents.some(content => line.includes(content))) {
                            protectedLinesContent.set(index + 1, line);
                        }
                    });
                }
            }
            
            // 데코레이션 업데이트 함수
            function updateDecorations() {
                if(model){
                    const lines = model.getValue().split('\n');
                    const newDecorations: editor.IModelDeltaDecoration[] = [];
                    
                    lines.forEach((line, index) => {
                        if (protectedContents.some(content => line.includes(content))) {
                            newDecorations.push({
                                range: new monaco.Range(index + 1, 1, index + 1, line.length + 1),
                                options: {
                                    isWholeLine: true,
                                    className: 'protected-line',
                                    stickiness: monaco.editor.TrackedRangeStickiness.GrowsOnlyWhenTypingBefore
                                }
                            });
                        }
                    });
                    
                    decorationIds.set(newDecorations);
                }
            }

            editor.onKeyDown((e) => {
                // 키 이벤트 처리 전에 자동완성 위젯 상태 확인
                const isSuggestionWidgetVisible = checkSuggestionWidgetVisibility();
                
                if (isSuggestionWidgetVisible) {
                  // 자동완성 위젯이 보이면 사용자 키 핸들러 처리 건너뛰기
                  return;
                }
                const position = editor.getPosition();
                if(position){
                    const lineNumber = position.lineNumber;
                    // 엔터 키가 눌렸을 때만 처리
                    if (e.keyCode === monaco.KeyCode.Enter) {
                        e.preventDefault();

                        // Calculate indentation
                        const indentationTabs = tracker.calculateIndentation(model, position);
                            
                        // 새 라인 삽입
                        editor.executeEdits('indentation', [{
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            },
                            text: '\n' + '\t'.repeat(indentationTabs)
                        }]);
                    }
            
                    // 백스페이스나 삭제 키 처리 - 보호된 라인 병합 방지
                    if (e.keyCode === monaco.KeyCode.Backspace || e.keyCode === monaco.KeyCode.Delete) {
                        const currentLine = lineNumber;
                        const prevLine = lineNumber - 1;
                        const nextLine = lineNumber + 1;
                        
                        // 보호된 라인 병합 방지
                        if (
                            (e.keyCode === monaco.KeyCode.Backspace && position.column === 1 && 
                            (protectedLinesContent.has(currentLine) || protectedLinesContent.has(prevLine))) ||
                            (e.keyCode === monaco.KeyCode.Delete && position.column >= model.getLineLength(lineNumber) + 1 && 
                            (protectedLinesContent.has(currentLine) || protectedLinesContent.has(nextLine)))
                        ) {
                            e.preventDefault();
                            return false;
                        }
                    }
                }
            })

            // 초기 보호된 라인 내용 저장
            updateProtectedLinesContent();
            
            // 초기 데코레이션 설정
            const initialDecorations: editor.IModelDeltaDecoration[] = [];
            const lines = model.getValue().split('\n');
            
            lines.forEach((line, index) => {
                if (protectedContents.some(content => line.includes(content))) {
                    initialDecorations.push({
                        range: new monaco.Range(index + 1, 1, index + 1, line.length + 1),
                        options: {
                            isWholeLine: true,
                            className: 'protected-line',
                            stickiness: monaco.editor.TrackedRangeStickiness.GrowsOnlyWhenTypingBefore
                        }
                    });
                }
            });
            
            // 데코레이션 적용
            const decorationIds = editor.createDecorationsCollection(initialDecorations);
        
            // CSS 스타일 추가
            const style = document.createElement('style');
            style.textContent = `
            .protected-line {
                background-color: rgba(255, 180, 180, 0.2);
                border-left: 3px solid #ff6b6b;
            }
            .protected-line-glyph:before {
                content: "🔒";
                margin-right: 5px;
            }
            `;
            document.head.appendChild(style);
        }

        setMonaco(monaco);
    }

    const handleFileUploaded = (files:RawFiles) => {
        setUploadedFiles(files);
        
        return storeFilesInIndexedDB(files);
    };

    // 코드 실행 함수 (구현 필요)
    const runCode = () => {
        if (monaco) {
            preloadFiles().then(() => {
                const dpi = document.getElementById('detectCurrentDPI');
                if(dpi){
                    PaperUnit.setDPI(dpi.offsetHeight/2.0);
                }
                // 에디터에서 Java 코드 가져오기
                const editor = monaco.editor.getModels()[0];
                if (!editor) return;
                
                const javaCode = editor.getValue();
                
                // Java 코드를 JavaScript로 변환
                const vars = codeMapping(javaCode);
                const builder:PDFBuilder = vars['builder'];
                const page:RectF = builder.pageLayout.getPageRect();
    
                // typescript 를 javascript 로 컴파일한 이후에 실행하기
    
                // 새 창 열기
                const popupWindow = window.open(
                    '', 
                    '새 창', 
                    `width=${page.width()-16},height=${page.height()-16},resizable=yes,scrollbars=yes`
                );
        
                // 새 창에 내용 작성
                if (popupWindow) {
                    popupWindow.document.writeln(`
<!DOCTYPE html>
<html>
    <head>
        <title>Android PDF Writer 미리보기</title>
        <style>
            html, body {
                display: flex;
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 0;
                background-color: #121212;
            }

            /* PDF 요소 스타일 */
            .pdf-linear-layout {
            width: 100%;
            }

            .pdf-grid-layout {
            width: 100%;
            }

            .pdf-grid-cell {
            min-height: 30px;
            }

            .pdf-text {
            word-break: break-word;
            }

            .pdf-image {
            display: block;
            }

            @media print {
                html, body {
                    overflow: visible;
                    margin: 0;
                    padding: 0;
                }
                body {
                    visibility: hidden;
                }
                
                #printSection, #printSection * {
                    visibility: visible;
                }
                
                #printSection {
                    position: absolute;
                    left: 0;
                    top: 0;
                }
            }
        </style>
    </head>
    <body>
        ${builder.result}
    </body>
</html>
                    `);
                    popupWindow.document.close();
                }
            });
        }
    };

    useEffect(()=>{
        if(monaco){
            console.log("에디터 준비 완료")
        }
    },[monaco]);
    
    useEffect(() => {
        // 실행 버튼 이벤트 설정
        document.getElementById('run-button')?.addEventListener('click', function() {
            runCode();
        });
        return () => {
            document.getElementById('run-button')?.removeEventListener('click', runCode);
        };
    }, [uploadedFiles]);

    return (
        <div className="apw-container mx-auto p-4">
            <div id="detectCurrentDPI"></div>
            <header className="header">
                <div className="logo">AndroidPDFWriter Library Playground</div>
                <div className="controls">
                    <button id="run-button" className="btn btn-primary">실행</button>
                    <a href="https://github.com/HanGyeolee/AndroidPdfWriter/blob/main/README-ko.md#androidpdfwriter" className="btn btn-primary" target="_blank"><Github></Github></a>
                </div>
            </header>

            <div className="filuploader-container">
                <div className="filuploader-title">리소스</div>
                <FileUploader onFileUploaded={handleFileUploaded} />
            </div>
        
            <div className="editor-container">
                <div className="editor-title">Java 코드</div>
                <Editor
                    height="100%"
                    defaultLanguage="java"
                    language='java'
                    defaultValue={defaultJavaCode}
                    theme='vs-dark'
                    onMount={handleEditorDidMount}
                />
            </div>
        </div>
    );
}
export {APW};