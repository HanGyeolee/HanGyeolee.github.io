import React, { useEffect, useRef } from "react";
import './apw.css';
import { PDFComponent } from "../../components/util/APWLIB/PDFComponent.tsx";
import { PDFGridLayout, PDFLinearLayout } from "../../components/util/APWLIB/PDFLayout.tsx";
import { LibraryProps } from "../../components/util/APWLIB/enum.tsx";

import Editor, { useMonaco } from '@monaco-editor/react';

const APW = () => {
    const monaco = useMonaco();

    document.title = "Android PDF Writer 라이브러리 webui";

    // 기본 Java 코드 예시
    const defaultJavaCode = 
    `PDFLinearLayout root = PDFLinearLayout.build(Orientation.Vertical)
        .setBackgroundColor(Color.BLUE)
        .addChild(PDFImage.fromResource(context, resourceId)
                .setCompress(true)
                .setHeight(200f)
                .setFit(Fit.CONTAIN))
        .addChild(PDFH1.build("Title", PDFFont.HELVETICA_BOLD)
                .setBackgroundColor(Color.RED)
                .setTextAlign(TextAlign.Center));`;

    // PDF 라이브러리 클래스 및 메서드 정보
    const pdfLibraryClasses:LibraryProps[] = [
        PDFComponent.toLibrary(),
        PDFLinearLayout.toLibrary(),
        PDFGridLayout.toLibrary()
    ];

    const setupMonacoEditor = () => {
        // 자동완성 제공자 등록
        monaco?.languages.registerCompletionItemProvider('java', {
            provideCompletionItems: function(model, position, context, token) {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                
                // 1. 변수 선언 추적
                const variableTypes = {};
                pdfLibraryClasses.forEach(classInfo => {
                    if (classInfo.variableDeclaration) {
                        const matches = [...textUntilPosition.matchAll(classInfo.variableDeclaration)];
                        matches.forEach(match => {
                            variableTypes[match[1]] = classInfo.name;
                        });
                    }
                });
                
                // 2. 메소드 체인 추적 - 현재 라인에서 메소드 체인 식별
                const lineContent = model.getLineContent(position.lineNumber);
                const lineUntilPosition = lineContent.substring(0, position.column - 1).trim();

                // 3. 직전 토큰이 '.' 인지 확인 (메소드 제안을 위한 조건)
                if (lineUntilPosition.endsWith('.')) {
                    // 객체 이름 추출 (예: 'layout.')
                    const objectNameMatch = lineUntilPosition.match(/(\w+)\.$/);
                    if (objectNameMatch) {
                        const objectName = objectNameMatch[1];
                        
                        // 변수의 타입 확인
                        if (objectName in variableTypes) {
                            const variableType = variableTypes[objectName];
                            
                            // 해당 타입의 클래스 정보 찾기
                            const classInfo = pdfLibraryClasses.find(c => c.name === variableType);
                            if (classInfo) {
                                // 인스턴스 메소드만 필터링 (정적 메소드 제외)
                                const instanceMethods = classInfo.methods.filter(m => !m.isStatic);
                                return {
                                    suggestions: instanceMethods.map(method => ({
                                        label: method.name,
                                        kind: monaco.languages.CompletionItemKind.Method,
                                        insertText: method.name + (method.params.length > 0 ? '(' : '()'),
                                        detail: `${method.name}(${method.params.join(', ')})`,
                                        documentation: {
                                            value: `**반환 타입**: ${method.returnType}`
                                        },
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            startColumn: position.column,
                                            endLineNumber: position.lineNumber,
                                            endColumn: position.column
                                        }
                                    }))
                                };
                            }
                        }
                        
                        // 메소드 체인 추적: 이전 메소드의 반환 타입에 따른 제안
                        for (const classInfo of pdfLibraryClasses) {
                            // 메소드 체인 패턴 검색 (예: layout.addChild().set...)
                            const methodChainMatches = [...textUntilPosition.matchAll(classInfo.methodChain)];
                            for (const match of methodChainMatches) {
                                if (match[1] === objectName) {
                                    const methodName = match[2];
                                    const method = classInfo.methods.find(m => m.name === methodName);
                                    if (method) {
                                        // 메소드의 반환 타입 찾기
                                        const returnType = method.returnType;
                                        // 반환 타입에 해당하는 클래스 정보 찾기
                                        const returnTypeClass = pdfLibraryClasses.find(c => c.name === returnType);
                                        if (returnTypeClass) {
                                            // 해당 타입의 인스턴스 메소드 제안
                                            const instanceMethods = returnTypeClass.methods.filter(m => !m.isStatic);
                                            return {
                                                suggestions: instanceMethods.map(method => ({
                                                    label: method.name,
                                                    kind: monaco.languages.CompletionItemKind.Method,
                                                    insertText: method.name + (method.params.length > 0 ? '(' : '()'),
                                                    detail: `${method.name}(${method.params.join(', ')})`,
                                                    documentation: {
                                                        value: `**반환 타입**: ${method.returnType}`
                                                    },
                                                    range: {
                                                        startLineNumber: position.lineNumber,
                                                        startColumn: position.column,
                                                        endLineNumber: position.lineNumber,
                                                        endColumn: position.column
                                                    }
                                                }))
                                            };
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // 4. 정적 메소드 제안 (클래스명 뒤에 '.' 입력 시)
                for (const classInfo of pdfLibraryClasses) {
                    if (classInfo.staticMethods && lineUntilPosition.endsWith(`${classInfo.name}.`)) {
                        // 정적 메소드만 필터링
                        const staticMethods = classInfo.methods.filter(m => m.isStatic);
                        return {
                            suggestions: staticMethods.map(method => ({
                                label: method.name,
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: method.name + (method.params.length > 0 ? '(' : '()'),
                                detail: `${method.name}(${method.params.join(', ')})`,
                                documentation: {
                                    value: `**반환 타입**: ${method.returnType}`
                                },
                                range: {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column
                                }
                            }))
                        };
                    }
                }
                
                // 5. 클래스 이름 제안 (새 변수 선언 시)
                if (/\w+\s+\w+\s*=\s*$/.test(lineUntilPosition)) {
                    return {
                        suggestions: pdfLibraryClasses.map(classInfo => ({
                            label: classInfo.name,
                            kind: monaco.languages.CompletionItemKind.Class,
                            insertText: classInfo.name,
                            detail: `class ${classInfo.name}`,
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: position.column,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            }
                        }))
                    };
                }
                
                // 6. 기본 제안: 모든 클래스 및 열거형
                return {
                    suggestions: pdfLibraryClasses.map(classInfo => ({
                        label: classInfo.name,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: classInfo.name,
                        detail: `class ${classInfo.name}`,
                        range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column
                        }
                    }))
                };
            }
        });
    }

    // 코드 실행 함수 (구현 필요)
    const runCode = () => {
        if (monaco) {
            // 기존 코드 실행 로직
            console.log('Running code...');
        }
    };
    
    useEffect(() => {
        // Monaco Editor 로드 후 설정
        if (monaco) {
            setupMonacoEditor();
            
            // 실행 버튼 이벤트 설정
            document.getElementById('run-button')?.addEventListener('click', function() {
                runCode();
            });
            
            // 초기 코드 자동 실행
            setTimeout(() => runCode(), 1000);
        }
    }, [monaco]);

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
            <Editor
                height="100%"
                defaultLanguage="java"
                defaultValue={defaultJavaCode}
                language='java'
                theme='vs-dark'
            />
            </div>
        
            <div className="preview-container">
            <div className="preview-title">PDF 미리보기</div>
            <div id="preview"></div>
            </div>
        </div>
    );
}

export {APW};