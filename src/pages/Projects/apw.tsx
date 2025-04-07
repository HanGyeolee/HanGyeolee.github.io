import React, { useEffect, useRef, useState } from "react";
import './apw.css';
import { FileUploader, storeFilesInIndexedDB } from '../../components/util/APWLIB/FileUploader.tsx';
import { IndentationTracker } from "../../components/util/APWLIB/IndentationTracker.tsx";
import { LibraryProps, PaperUnit, RawFiles } from "../../components/util/APWLIB/enum.tsx";
import { Github } from 'lucide-react';

import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { languages, editor } from 'monaco-editor';

import { codeMapping, pdfLibraryClasses } from "../../components/util/APWLIB/CodeMapper.tsx";
import { PDFBuilder } from "../../components/util/APWLIB/PDFBuilder.tsx";
import { RectF } from "../../components/util/APWLIB/PDFPageLayout.tsx";
import { preloadFiles } from "../../components/util/APWLIB/PDFResource.tsx";

const APW = () => {
    const [monaco, setMonaco] = useState<Monaco>();
    const [uploadedFiles, setUploadedFiles] = useState<RawFiles>({
        file: [],
        assets: [],
        resource: []
    });

    document.title = "Android PDF Writer 라이브러리 webui";

    // 기본 Java 코드 예시
    const defaultJavaCode = 
    `PDFBuilder builder = new PDFBuilder(
    PageLayoutFactory.createLayout(Paper.A4, 10, 10)
); PDFLayout root = 
    PDFLinearLayout.build(Orientation.Vertical)
    .setBackgroundColor(Color.BLUE)
    .addChild(PDFImage.fromResource(null, R.id.testImage)
        .setCompress(true)
        .setHeight(200)
        .setFit(Fit.CONTAIN))
    .addChild(PDFH1.build("Title")
        .setFontFromFile("test-font.ttf")
        .setBackgroundColor(Color.RED)
        .setTextAlign(TextAlign.Center));
builder.draw(root);`;

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // 자동완성 제공자 등록
        monaco.languages.registerCompletionItemProvider('java', {
            triggerCharacters:['.','=','(',',',' '],
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
                            return undefined;
                        }
                        
                        // 사례 2: 클래스에서 변수 호출: ClassName.variable
                        const variableMatch = expr.match(/(\w+)\s*\.\s*(\w+)\s*$/);
                        if (variableMatch) {
                            const className = variableMatch[1];
                            const variableName = variableMatch[2];
                            
                            // 클래스를 찾습니다.
                            const classInfo = pdfLibraryClasses.find(c => c.name === className);
                            if (classInfo && classInfo.variables) {
                                // 정적 변수를 찾고 반환 유형을 가져옵니다.
                                const variableInfo = classInfo.variables.find(v => v.name === variableName && v.isStatic);
                                return variableInfo?.type;
                            }
                            return undefined;
                        }

                        // 사례 3: 매개변수가 있는 또는 없는 메서드 호출: methodName(...) 또는 chainedMethod(...)
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
                                if (classInfo){
                                    // 생성자
                                    if(classInfo.name === methodName){
                                        return classInfo.constructors?classInfo.name:undefined;
                                    }
                                    else if(classInfo.methods) {
                                        // 메서드 정의를 찾아 반환 유형을 가져옵니다.
                                        const methodInfo = classInfo.methods.find(m => m.name === methodName);
                                        return methodInfo?.returnType;
                                    }
                                }
                            } else {
                                // 클래스에서 직접 정적 메서드 호출인지 확인합니다.
                                for (const classInfo of pdfLibraryClasses) {
                                    // 생성자
                                    if(classInfo.name === methodName){
                                        return classInfo.constructors?classInfo.name:undefined;
                                    }
                                    else if (classInfo.methods) {
                                        const methodInfo = classInfo.methods.find(m => m.name === methodName && m.isStatic);
                                        if(methodInfo)
                                            return methodInfo.returnType;
                                    }
                                }
                            }
                            return undefined;
                        }

                        // 사례 4: 간단한 변수 참조 | 클래스 이름 참조
                        const objectNameMatch = expr.match(/(\w+)$/);
                        if (objectNameMatch) {
                            const objectName = objectNameMatch[1];
                            if (objectName in variableTypes) {
                                return variableTypes[objectName].name;
                            } else {
                                const type = pdfLibraryClasses.find(c => c.name === objectName);
                                if(type){
                                    return type?.name;
                                }
                            }
                        }

                        // 사례 5: 앞에 '.' 로 시작하는 경우
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
                    } else {
                        // 생성자 호출
                        const info = pdfLibraryClasses.find(info => info.name === methodName);
                        targetType = info?.name;
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
                                        kind: languages.CompletionItemKind.Method,
                                        insertText: method.params.length > 0  ? `${method.name}($0)` : `${method.name}()`,
                                        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
                                        } : undefined
                                    }))
                                };
                            }
                            // 3-1. ENUM 리스트 제안
                            classInfo = pdfLibraryClasses.find(c => c.name === objectName && c.type === 'Enum');
                            if (classInfo && classInfo.variables) {
                                return {
                                    suggestions: classInfo.variables.map((EnumConst, idx) => ({
                                        label: EnumConst.name,
                                        kind: languages.CompletionItemKind.EnumMember,
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
                    const classInfo = trackMethodChain(undefined, variableTypes, pdfLibraryClasses);
                    if (classInfo) {
                        let suggestions: languages.CompletionItem[] = [];
                        
                        // Add methods
                        if (classInfo.methods) {
                            // Filter for instance methods
                            const instanceMethods = classInfo.methods.filter(m => !m.isStatic);
                            suggestions = [...suggestions, ...instanceMethods.map(method => ({
                                label: method.name,
                                kind: languages.CompletionItemKind.Method,
                                insertText: method.params.length > 0  ? `${method.name}($0)` : `${method.name}()`,
                                insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
                                } : undefined
                            }))];
                        }
                        
                        // Add enum values or properties if applicable
                        if (classInfo.variables) {
                            const instanceVariable = classInfo.variables.filter(m => !m.isStatic);
                            suggestions = [...suggestions, ...instanceVariable.map(variable => ({
                                label: variable.name,
                                kind: languages.CompletionItemKind.Variable,
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
                    if (classInfo){
                        let methodInfo:{
                            params: string[];
                            document?: string;
                        } | undefined = undefined;
                        // 파라미터 타입에 따른 제안 생성
                        let suggestions:languages.CompletionItem[] = [];
                        if(classInfo.name === methodName&&classInfo.constructors){
                            methodInfo = classInfo.constructors.find(m => m.params.length > paramIndex);
                        }
                        else if(classInfo.methods) {
                            methodInfo = classInfo.methods.find(m => m.name === methodName && m.params.length > paramIndex);
                        }

                        if(methodInfo){
                            const paramType = methodInfo.params[paramIndex];
                            const param = paramText.split(',')[paramIndex].trim();
                            const startColumn = lineContent.indexOf(methodName+"(")+2+methodName.length+paramText.indexOf(param);

                            ///*
                            const typeList = pdfLibraryClasses;
                            for (const mType of typeList){
                                // 클래스 정적 메소드 중 파라미터 타입을 반환하는 메소드 제안
                                if(mType.type === "Class" && mType.methods) {
                                    suggestions = [...suggestions, ...mType.methods.filter(m => m.isStatic && 
                                        `${mType.name}.${m.name}`.toLowerCase().startsWith(param) &&
                                        (m.returnType === paramType ||  // 반환 값의 타입과 일치할 때
                                        (mType.name === m.returnType && mType.extend === paramType) || // 반환 값의 상속 타입과 일치할 때
                                        pdfLibraryClasses.find(c => c.name === m.returnType)?.extend === paramType) // 다른 클래스의 상속 타입과 일치 할 때 
                                    )
                                    .map(method => {
                                        let item:languages.CompletionItem = ({
                                            label: `${mType.name}.${method.name}`,
                                            kind: languages.CompletionItemKind.Method,
                                            insertText: method.params.length > 0  ? `${mType.name}.${method.name}($0)` : `${mType.name}.${method.name}()`,
                                            insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
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
                                            } : undefined
                                        });
                                        return item;
                                    })];
                                }
                                // Enum 제안
                                else if(mType.type === "Enum" && mType.variables) {
                                    suggestions = [...suggestions, ...mType.variables.filter(en => en.isStatic &&
                                        `${mType.name}.${en.name}`.toLowerCase().startsWith(param) &&
                                        (mType.name === paramType || en.type === paramType)
                                    ).map(en => {
                                        let item:languages.CompletionItem = ({
                                            label: `${mType.name}.${en.name}`,
                                            kind: languages.CompletionItemKind.EnumMember,
                                            insertText: `${mType.name}.${en.name}`,
                                            detail: `${mType.name} Enum value`,
                                            range: {
                                                startLineNumber: position.lineNumber,
                                                startColumn: startColumn,
                                                endLineNumber: position.lineNumber,
                                                endColumn: position.column
                                            }
                                        });
                                        return item;
                                    })];
                                }
                            }
                            //*/
                            // 타입이 동일한 변수 제안
                            for(const name in variableTypes){
                                if((variableTypes[name].name === paramType || variableTypes[name].extend === paramType) &&
                                    variableTypes[name].name.toLowerCase().startsWith(param)){
                                    suggestions = [...suggestions, {
                                        label: name,
                                        kind: languages.CompletionItemKind.Variable,
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

                // 5. 직전 토큰이 'new ' 인지 확인
                const newobjectMatch = lineUntilPosition.match(/(\w+)\s+\w+\s*=\s*(new\s+)(\w*)$/);
                if (newobjectMatch){
                    const className = newobjectMatch[1].toLowerCase();
                    const token = newobjectMatch[2].toLowerCase();
                    const objectName = newobjectMatch[3].toLowerCase();
                    const startColumn = lineContent.indexOf(token)+2+token.length-objectName.length;
                    const filterd = pdfLibraryClasses.filter(info => 
                        (info.name.toLowerCase().startsWith(className)) && info.constructors
                    );
                    let suggestions:languages.CompletionItem[] = [];
                    for (const info of filterd) {
                        if(info.constructors){
                            suggestions = [...suggestions,...info.constructors.map(c => ({
                                label: info.name,
                                kind: languages.CompletionItemKind.Method,
                                insertText: c.params.length > 0  ? `${info.name}($0)` : `${info.name}()`,
                                insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                detail: `${info.name}(${c.params.join(', ')})`,
                                documentation: {
                                    value: `**반환 타입**: ${info.name}`
                                },
                                range: {
                                    startLineNumber: position.lineNumber,
                                    startColumn: startColumn,
                                    endLineNumber: position.lineNumber,
                                    endColumn: position.column
                                },
                                command: c.params.length > 0 ? {
                                id: 'editor.action.triggerSuggest',
                                title: 'Suggest',
                                arguments: []
                                } : undefined
                            }))]
                        }
                    }
                    return {
                        suggestions
                    }
                }
                
                // 6. 클래스 이름 제안 (새 변수 선언 시)
                const variableMatch = lineUntilPosition.match(/(\w+)\s+\w+\s*=\s*(\w+)$/);
                if (variableMatch) {
                    const objectName = variableMatch[1].toLowerCase();
                    const query = variableMatch[2].toLowerCase();
                    const startColumn = lineContent.indexOf(query)+1;
                    return {
                        suggestions: pdfLibraryClasses.filter(info => 
                            info.name.toLowerCase().startsWith(objectName) && info.methods && info.methods.find(m => m.isStatic && 
                                (m.returnType === objectName ||  // 반환 값의 타입과 일치할 때
                                (info.name === m.returnType && info.extend === objectName ) || // 반환 값의 상속 타입과 일치할 때
                                pdfLibraryClasses.find(c => c.name === m.returnType)?.extend === objectName) // 다른 클래스의 상속 타입과 일치 할 때 )
                            )
                        ).map(classInfo => ({
                            label: classInfo.name,
                            kind: (classInfo.type === 'Class') ? languages.CompletionItemKind.Class : languages.CompletionItemKind.Enum,
                            insertText: classInfo.name,
                            detail: `${classInfo.type} ${classInfo.name}`,
                            range: {
                                startLineNumber: position.lineNumber,
                                startColumn: startColumn,
                                endLineNumber: position.lineNumber,
                                endColumn: position.column
                            }
                        }))
                    };
                }

                // 7. 기본 제안: 모든 클래스 및 열거형
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
                            kind: (classInfo.type === 'Class') ? languages.CompletionItemKind.Class : languages.CompletionItemKind.Enum,
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
                            kind: languages.CompletionItemKind.Variable,
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
        if(!monaco){
            console.log("새로고침 필요")
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