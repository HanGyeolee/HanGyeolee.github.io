import React, { useEffect, useRef, useState } from "react";
import './apw.css';
import { PDFComponent } from "../../components/util/APWLIB/PDFComponent.tsx";
import { PDFGridLayout, PDFLinearLayout } from "../../components/util/APWLIB/PDFLayout.tsx";
import { LibraryProps, PDFColorLibrary, PDFFitLibrary, PDFOrientationLibrary } from "../../components/util/APWLIB/enum.tsx";
import { Github } from 'lucide-react';

import Editor, { Monaco, OnMount } from '@monaco-editor/react';

const APW = () => {
    const [monaco, setMonaco] = useState<Monaco|undefined>(undefined);

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
        PDFGridLayout.toLibrary(),
        PDFColorLibrary,
        PDFOrientationLibrary,
        PDFFitLibrary
    ];

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        setMonaco(monaco);
        // 자동완성 제공자 등록
        monaco?.languages.registerCompletionItemProvider('java', {
            triggerCharacters:['.','=','(',','],
            provideCompletionItems: function(model, position, context, token) {
                function trackMethodChain(text: string|undefined, variableTypes: Record<string, LibraryProps>, pdfLibraryClasses: LibraryProps[]): LibraryProps | undefined {
                    // 커서 위치까지 현재 줄의 내용을 가져옵니다.
                    let lineUntilPosition = model.getLineContent(position.lineNumber).substring(0, position.column - 1).trim();
                    if(text) {
                        lineUntilPosition = text;
                    }
                    
                    // 현재 줄이 점(.)으로 끝나지 않으면 메서드 제안을 찾는 중이 아닙니다.
                    if (!lineUntilPosition.endsWith('.')) {
                        return undefined;
                    }
                    
                    // 점 앞의 표현식을 추출합니다.
                    let expression = lineUntilPosition.substring(0, lineUntilPosition.length - 1).trim();
                    // 모든 공백 시퀀스(줄 바꿈 및 탭 포함)를 하나의 공백으로 대체합니다.
                    // 이 표현식을 더 쉽게 구문 분석할 수 있도록 정규화합니다.
                    expression = expression.replace(/\s+/g, ' ');
                    
                    // 중첩된 괄호를 올바르게 처리합니다.
                    const extractLastExpression = (expr: string): string => {
                        let parenCount = 0;
                        let lastValidIndex = expr.length - 1;
                        
                        // 현재 표현식의 시작 부분을 찾기 위해 뒤로 스캔합니다.
                        for (let i = expr.length - 1; i >= 0; i--) {
                            if (expr[i] === ')') parenCount++;
                            else if (expr[i] === '(') parenCount--;
                            
                            // 일치하는 여는 괄호를 찾았습니다.
                            if (parenCount < 0) {
                                // 여는 괄호 앞의 메서드 또는 변수 이름을 찾습니다.
                                const methodMatch = expr.substring(0, i).match(/(\w+)$/);
                                if (methodMatch) {
                                    return expr.substring(0, i - methodMatch[1].length);
                                }
                                return "";
                            }
                        }
                        return expr;
                    };
                    
                    // 표현식의 유형을 결정합니다.
                    const determineExpressionType = (expr: string, idx?:number): string | undefined => {
                        idx = idx ? idx : 0;
                        if(idx > 0) {
                            if(position.lineNumber - idx >= 0)
                                expr = model.getLineContent(position.lineNumber - idx).trim().replace(/\s+/g, ' ') + expr;
                        }
                        
                        // 사례 1: 클래스에서 정적 메서드 호출: ClassName.methodName(...)
                        const staticMethodMatch = expr.match(/(\w+)\s*\.\s*(\w+)\s*\(.*\)$/);
                        if (staticMethodMatch) {
                            const className = staticMethodMatch[1];
                            const methodName = staticMethodMatch[2];
                            
                            // 클래스를 찾습니다.
                            const classInfo = pdfLibraryClasses.find(c => c.name === className);
                            if (classInfo && classInfo.methods) {
                                // 정적 메서드를 찾고 반환 유형을 가져옵니다.
                                const methodInfo = classInfo.methods.find(m => m.name === methodName && m.isStatic);
                                return methodInfo?.returnType;
                            }
                            return '';
                        }
                        
                        // 사례 2: 매개변수가 있는 또는 없는 메서드 호출: methodName(...) 또는 chainedMethod(...)
                        const methodCallMatch = expr.match(/(\w+)\s*\((.*)\)$/);
                        if (methodCallMatch) {
                            const methodName = methodCallMatch[1];
                            console.log(`${methodName}(...)`)
                            
                            // 이 메서드 호출 앞에 오는 내용을 찾습니다.
                            const beforeMethod = extractLastExpression(expr.substring(0, expr.length - methodName.length - methodCallMatch[2].length - 2));
                            const baseType = determineExpressionType(beforeMethod);
                            
                            if (baseType) {
                                // 이 유형에 대한 클래스 정의를 찾습니다.
                                const classInfo = pdfLibraryClasses.find(c => c.name === baseType);
                                if (classInfo && classInfo.methods) {
                                    // 메서드 정의를 찾아 반환 유형을 가져옵니다.
                                    const methodInfo = classInfo.methods.find(m => m.name === methodName);
                                    return methodInfo?.returnType;
                                }
                            } else {
                                // 클래스에서 직접 정적 메서드 호출인지 확인합니다.
                                for (const classInfo of pdfLibraryClasses) {
                                    if (classInfo.methods) {
                                        const methodInfo = classInfo.methods.find(m => m.name === methodName && m.isStatic);
                                        if (methodInfo) {
                                            return methodInfo.returnType;
                                        }
                                    }
                                }
                            }
                        }

                        // 사례 3: 간단한 변수 참조 | 클래스 이름 참조
                        const objectNameMatch = expr.match(/(\w+)$/);
                        if (objectNameMatch) {
                            const objectName = objectNameMatch[1];
                            if (objectName in variableTypes) {
                                return variableTypes[objectName].name;
                            } else {
                                let type = pdfLibraryClasses.find(c => c.name === objectName);
                                return type?.name ?? undefined;
                            }
                        }

                        // 사례 4: 앞에 '.' 로 시작하는 경우
                        const lineTerminatorMatch = expr.match(/^\./);
                        if(lineTerminatorMatch){
                            return determineExpressionType(expr, idx + 1);
                        }
                        return undefined;
                    };
                    
                    // 표현식의 유형을 가져옵니다.
                    const expressionType = determineExpressionType(expression, expression.length > 0 ? 0 : 1);
                    
                    if (expressionType) {
                        // 이 유형에 대한 클래스 정의를 찾습니다.
                        return pdfLibraryClasses.find(c => c.name === expressionType);
                    }
                    
                    return undefined;
                }
                // 매개변수 컨텍스트 감지 로직
                function detectParameterContext() {
                    const lineContent = model.getLineContent(position.lineNumber);
                    const contentBeforeCursor = lineContent.substring(0, position.column - 1);
                    
                    // 괄호 내부에 있는지 체크
                    const match = contentBeforeCursor.match(/(\w+)\s*\(([^()]*)$/);
                    if (!match) return null;
                    
                    const methodName = match[1];
                    const paramText = match[2];
                    const paramIndex = paramText.split(',').length - 1;
                    
                    // 메소드를 호출하는 객체나 클래스 찾기
                    let beforeMethod = contentBeforeCursor.substring(0, contentBeforeCursor.lastIndexOf(methodName));
                    beforeMethod = beforeMethod.trim();
                    
                    // 메소드 체인 또는 직접 호출 분석
                    let targetType;
                    if (beforeMethod.endsWith('.')) {
                        // 메소드 체인 분석을 위해 trackMethodChain 호출
                        const classInfo = trackMethodChain(beforeMethod, variableTypes, pdfLibraryClasses);
                        targetType = classInfo?.name;
                    } else if (variableTypes[methodName]) {
                        // 자체 메소드 호출
                        targetType = variableTypes[methodName];
                    }
                    
                    return { methodName, paramIndex, targetType, paramText };
                }
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                
                // 1. 변수 선언 추적
                const variableTypes:Record<string,LibraryProps> = {};
                pdfLibraryClasses.forEach(classInfo => {
                    if (classInfo.variableDeclaration) {
                        const matches = [...textUntilPosition.matchAll(classInfo.variableDeclaration)];
                        matches.forEach(match => {
                            variableTypes[match[1]] = classInfo;
                        });
                    }
                });
                
                // 2. 메소드 체인 추적 - 현재 라인에서 메소드 체인 식별
                const lineContent = model.getLineContent(position.lineNumber);
                const lineUntilPosition = lineContent.substring(0, position.column - 1).trim();

                // 3. 직전 토큰이 '.' 인지 확인 (메소드 제안을 위한 조건)
                if (lineUntilPosition.endsWith('.')) {
                    // 객체 이름 추출 (예: 'layout.')
                    const objectNameMatch = lineUntilPosition.match(/(\w+)(?!\))\.$/);
                    if (objectNameMatch) {
                        const objectName = objectNameMatch[1];
                        // 객체 이름이 아니라 클래스명인 경우
                        if (!(objectName in variableTypes)) {
                            // 3. 정적 메소드 제안
                            let classInfo = pdfLibraryClasses.find(c => c.name === objectName && c.type === 'Class');
                            if (classInfo && classInfo.methods) {
                                // 정적 메소드만 필터링
                                const staticMethods = classInfo.methods.filter(m => m.isStatic);
                                return {
                                    suggestions: staticMethods.map(method => ({
                                        label: method.name,
                                        kind: monaco.languages.CompletionItemKind.Method,
                                        insertText: method.params.length > 0  ? `${method.name}($0)` : `${method.name}()`,
                                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                        detail: `${method.name}(${method.params.join(', ')})`,
                                        documentation: {
                                            value: `**반환 타입**: ${method.returnType}`
                                        },
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            startColumn: position.column,
                                            endLineNumber: position.lineNumber,
                                            endColumn: position.column
                                        },
                                        command: method.params.length > 0 ? {
                                          id: 'editor.action.triggerSuggest',
                                          title: 'Suggest',
                                          arguments: []
                                        } : null
                                    }))
                                };
                            }
                            // 3-1. ENUM 리스트 제안
                            classInfo = pdfLibraryClasses.find(c => c.name === objectName && c.type === 'Enum');
                            if (classInfo && classInfo.variables) {
                                return {
                                    suggestions: classInfo.variables.map((EnumConst, idx) => ({
                                        label: EnumConst.name,
                                        kind: monaco.languages.CompletionItemKind.EnumMember,
                                        insertText: EnumConst.name,
                                        detail: `public static final int ${EnumConst.name} = ${idx}`,
                                        documentation: {
                                            value: `${EnumConst?.document}`
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

                    // If not a simple object reference, try method chain tracking
                    const classInfo = trackMethodChain(textUntilPosition, variableTypes, pdfLibraryClasses);
                    if (classInfo) {
                        let suggestions: any[] = [];
                        
                        // Add methods
                        if (classInfo.methods) {
                            // Filter for instance methods
                            const instanceMethods = classInfo.methods.filter(m => !m.isStatic);
                            suggestions = [...suggestions, ...instanceMethods.map(method => ({
                                label: method.name,
                                kind: monaco.languages.CompletionItemKind.Method,
                                insertText: method.params.length > 0  ? `${method.name}($0)` : `${method.name}()`,
                                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: `${method.name}(${method.params.join(', ')})`,
                                documentation: {
                                    value: `**반환 타입**: ${method.returnType}`
                                },
                                range: {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column
                                },
                                command: method.params.length > 0 ? {
                                  id: 'editor.action.triggerSuggest',
                                  title: 'Suggest',
                                  arguments: []
                                } : null
                            }))];
                        }
                        
                        // Add enum values or properties if applicable
                        if (classInfo.variables) {
                            suggestions = [...suggestions, ...classInfo.variables.map(variable => ({
                                label: variable.name,
                                kind: monaco.languages.CompletionItemKind.Variable,
                                insertText: variable.name,
                                detail: variable.name,
                                documentation: {
                                    value: `**타입**: ${variable.type}`
                                },
                                range: {
                                    startLineNumber: position.lineNumber,
                                    startColumn: position.column,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column
                                }
                                }))];
                        }
                        
                        return { suggestions };
                    }
                }

                // 4. 매개변수 컨텍스트 확인
                const paramContext = detectParameterContext();
                if (paramContext) {
                    const { methodName, paramIndex, targetType, paramText } = paramContext;
                    // 해당 클래스와 메소드 찾기
                    const classInfo = pdfLibraryClasses.find(c => c.name === targetType);
                    if (classInfo && classInfo.methods) {
                        const methodInfo = classInfo.methods.find(m => m.name === methodName);
                        
                        if (methodInfo && methodInfo.params.length > paramIndex) {
                            const paramType = methodInfo.params[paramIndex];
                            const param = paramText.split(',')[paramIndex].trim();
                            const startColumn = lineContent.indexOf(methodName)+2+methodName.length+paramText.indexOf(param);
                            
                            // 파라미터 타입에 따른 제안 생성
                            let suggestions:any[] = [];
                            const typeList = pdfLibraryClasses.filter(c => c.name === paramType || c.extend === paramType);
                            for (const mType of typeList){
                                // 클래스 정적 메소드 중 파라미터 타입을 반환하는 메소드 제안
                                if(mType.type === "Class" && mType.methods) {
                                    suggestions = [...suggestions, ...mType.methods.filter(m => m.isStatic && 
                                        `${mType.name}.${m.name}`.toLowerCase().startsWith(param) &&
                                        (m.returnType === paramType ||  // 반환 값의 타입과 일치할 때
                                        (mType.name === m.returnType && mType.extend === paramType ) || // 반환 값의 상속 타입과 일치할 때
                                        pdfLibraryClasses.find(c => c.name === m.returnType)?.extend === paramType) // 다른 클래스의 상속 타입과 일치 할 때 
                                    )
                                    .map(method => ({
                                        label: `${mType.name}.${method.name}`,
                                        kind: monaco.languages.CompletionItemKind.Method,
                                        insertText: method.params.length > 0  ? `${mType.name}.${method.name}($0)` : `${mType.name}.${method.name}()`,
                                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                        detail: `${mType.name}.${method.name}(${method.params.join(', ')})`,
                                        documentation: {
                                            value: `**반환 타입**: ${method.returnType}`
                                        },
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            startColumn: startColumn,
                                            endLineNumber: position.lineNumber,
                                            endColumn: position.column
                                        },
                                        command: method.params.length > 0 ? {
                                          id: 'editor.action.triggerSuggest',
                                          title: 'Suggest',
                                          arguments: []
                                        } : null
                                    }))];
                                }
                                // Enum 제안
                                if(mType.type === "Enum" && mType.variables) {
                                    suggestions = [...suggestions, ...mType.variables.filter(en =>
                                        `${mType.name}.${en.name}`.toLowerCase().startsWith(param)
                                    ).map(en => ({
                                        label: `${mType.name}.${en.name}`,
                                        kind: monaco.languages.CompletionItemKind.EnumMember,
                                        insertText: `${mType.name}.${en.name}`,
                                        detail: `${mType.name} Enum value`,
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            startColumn: startColumn,
                                            endLineNumber: position.lineNumber,
                                            endColumn: position.column
                                        }
                                    }))];
                                }
                            }
                            // 타입이 동일한 변수 제안
                            for(const name in variableTypes){
                                if((variableTypes[name].name === paramType || variableTypes[name].extend === paramType) &&
                                    variableTypes[name].name.toLowerCase().startsWith(param)){
                                    suggestions = [...suggestions, {
                                        label: name,
                                        kind: monaco.languages.CompletionItemKind.Variable,
                                        insertText: name,
                                        detail: name,
                                        range: {
                                            startLineNumber: position.lineNumber,
                                            startColumn: startColumn,
                                            endLineNumber: position.lineNumber,
                                            endColumn: position.column
                                        }
                                    }];
                                }
                            }

                            return {
                                suggestions
                            }
                        }
                    }
                }
                
                // 5. 클래스 이름 제안 (새 변수 선언 시)
                if (/\w+\s+\w+\s*=\s*$/.test(lineUntilPosition)) {
                    return {
                        suggestions: pdfLibraryClasses.map(classInfo => ({
                            label: classInfo.name,
                            kind: (classInfo.type === 'Class') ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Enum,
                            insertText: classInfo.name,
                            detail: `${classInfo.type} ${classInfo.name}`,
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
                const objectNameMatch = lineUntilPosition.match(/(\w+)$/);
                if (objectNameMatch) {
                    const objectName = objectNameMatch[1].toLowerCase();
                    const startColumn = lineContent.indexOf(objectName)+1;
                    const result:string[] = [];
                    for (const key in variableTypes) {
                        // 이미 작성된 변수
                        if (key.startsWith(objectName)) {
                            result.push(key);
                        }
                    }
                    return {
                        suggestions: [...pdfLibraryClasses.filter(info => 
                            info.name.toLowerCase().startsWith(objectName)
                        )
                            .map(classInfo => ({
                            label: classInfo.name,
                            kind: (classInfo.type === 'Class') ? monaco.languages.CompletionItemKind.Class : monaco.languages.CompletionItemKind.Enum,
                            insertText: classInfo.name,
                            detail: `${classInfo.type} ${classInfo.name}`,
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: startColumn,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            }
                        })),...result.map(name => ({
                            label: name,
                            kind: monaco.languages.CompletionItemKind.Variable,
                            insertText: name,
                            detail: name,
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: startColumn,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            }
                        }))]
                    };
                }

                return {
                    suggestions: []
                };
            }
        });

        runCode();
    }

    // 코드 실행 함수 (구현 필요)
    const runCode = () => {
        if (monaco) {
            // 기존 코드 실행 로직
            console.log('Running code...');
        }
    };
    
    useEffect(() => {
        // 실행 버튼 이벤트 설정
        document.getElementById('run-button')?.addEventListener('click', function() {
            runCode();
        });
    }, []);

    return (
        <div className="container mx-auto p-4">
            <header className="header">
            <div className="logo">AndroidPDFWriter 라이브러리 맛보기</div>
            <div className="controls">
                <button id="run-button" className="btn btn-primary">실행</button>
                <a href="https://github.com/HanGyeolee/AndroidPdfWriter/blob/main/README-ko.md#androidpdfwriter" className="btn btn-primary" target="_blank"><Github></Github></a>
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
                onMount={handleEditorDidMount}
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