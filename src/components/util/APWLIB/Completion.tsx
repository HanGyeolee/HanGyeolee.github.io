import { languages, editor, Position, IRange } from 'monaco-editor';
import { LibMethod, LibraryProps, LibVariable } from "./enum";
import { contextLibrary } from './CodeMapper.tsx';

interface Variable {
    name: string;
    type: LibraryProps;
}

interface CompletionContext {
    type: 'dot' | 'parameter' | 'new' | 'general';
    ownerType?: LibraryProps;
    isStatic?: boolean;
    methodName?: string;
    paramIndex?: number;
    query?: string;
}

export function provideJavaCompletions(
    model: editor.ITextModel, 
    position: Position, 
    pdfLibraryClasses: LibraryProps[]
): { suggestions: languages.CompletionItem[] } {
    
    // 1. 변수 추출 (전체 텍스트에서)
    const variables = extractVariables(model, position, pdfLibraryClasses);
    
    // 2. 현재 컨텍스트 분석
    const context = analyzeContext(model, position, variables, pdfLibraryClasses);
    
    // 3. 컨텍스트에 따른 추천 생성
    const suggestions = generateSuggestions(context, variables, pdfLibraryClasses, position);
    
    return { suggestions };
}

/**
 * 변수 추출 - variableDeclaration 정규식 사용
 */
function extractVariables(
    model: editor.ITextModel, 
    position: Position, 
    pdfLibraryClasses: LibraryProps[]
): Variable[] {
    const variables: Variable[] = [
        { name: 'context', type: contextLibrary() } // 기본 context 변수
    ];
    
    // 전체 텍스트 가져오기 (현재 위치까지)
    const fullText = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    });
    
    // 각 클래스의 변수 선언 패턴으로 변수 추출
    pdfLibraryClasses.forEach(classInfo => {
        if (classInfo.variableDeclaration) {
            const matches = [...fullText.matchAll(classInfo.variableDeclaration)];
            matches.forEach(match => {
                if (match[1]) {
                    variables.push({
                        name: match[1],
                        type: classInfo
                    });
                }
            });
        }
    });
    
    return variables;
}

/**
 * 현재 컨텍스트 분석
 */
function analyzeContext(
    model: editor.ITextModel,
    position: Position,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[]
): CompletionContext {
    const currentLine = model.getLineContent(position.lineNumber);
    const beforeCursor = currentLine.substring(0, position.column - 1);
    
    // 전체 텍스트 가져오기 (멀티라인 체인 처리용)
    const fullTextBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    });
    
    // 1. 점(.) 컨텍스트 확인
    if (beforeCursor.trimEnd().endsWith('.')) {
        return analyzeDotContext(fullTextBeforeCursor, variables, pdfLibraryClasses);
    }
    
    // 2. 매개변수 컨텍스트 확인 (괄호 안)
    const paramContext = analyzeParameterContext(fullTextBeforeCursor, variables, pdfLibraryClasses);
    if (paramContext) {
        return paramContext;
    }
    
    // 3. new 키워드 컨텍스트
    const newMatch = beforeCursor.match(/new\s+(\w*)$/);
    if (newMatch) {
        return {
            type: 'new',
            query: newMatch[1] || ''
        };
    }
    
    // 4. 일반 컨텍스트 (클래스명, 변수명 등)
    const wordMatch = beforeCursor.match(/(\w+)$/);
    return {
        type: 'general',
        query: wordMatch ? wordMatch[1] : ''
    };
}

/**
 * 점(.) 컨텍스트 분석
 */
function analyzeDotContext(
    fullTextBeforeCursor: string,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[]
): CompletionContext {
    // 점 제거하고 표현식 추출
    const expressionBeforeDot = fullTextBeforeCursor.substring(0, fullTextBeforeCursor.lastIndexOf('.'));
    
    // 오른쪽에서 왼쪽으로 표현식 추출
    const expression = extractExpression(expressionBeforeDot);
    
    // 표현식 타입 추론
    const { type: ownerType, isStatic } = inferExpressionType(expression, variables, pdfLibraryClasses);
    
    return {
        type: 'dot',
        ownerType,
        isStatic
    };
}

/**
 * 매개변수 컨텍스트 분석
 */
function analyzeParameterContext(
    fullTextBeforeCursor: string,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[]
): CompletionContext | null {
    // 괄호 안에 있는지 확인
    let parenCount = 0;
    let openParenIndex = -1;
    
    for (let i = fullTextBeforeCursor.length - 1; i >= 0; i--) {
        const char = fullTextBeforeCursor[i];
        if (char === ')') {
            parenCount++;
        } else if (char === '(') {
            parenCount--;
            if (parenCount < 0) {
                openParenIndex = i;
                break;
            }
        }
    }
    
    if (openParenIndex === -1) return null;
    
    // 매개변수 부분 추출
    const paramText = fullTextBeforeCursor.substring(openParenIndex + 1);
    
    // 매개변수 부분에서 점으로 끝나는지 확인
    if (paramText.trimEnd().endsWith('.')) {
        // 매개변수 안에서 점 컨텍스트로 처리
        var context = analyzeDotContext(fullTextBeforeCursor, variables, pdfLibraryClasses)
        context.type = 'dot'
        return context;
    }
    
    // 매개변수 인덱스 계산
    const paramIndex = calculateParameterIndex(paramText);
    
    // 메소드명 추출
    const beforeParen = fullTextBeforeCursor.substring(0, openParenIndex);
    const methodMatch = beforeParen.match(/(\w+)$/);
    if (!methodMatch) return null;
    
    const methodName = methodMatch[1];
    const beforeMethod = beforeParen.substring(0, beforeParen.length - methodName.length);
    
    // 소유자 타입 찾기
    let ownerType: LibraryProps|undefined;
    let isStatic = false;
    
    if (beforeMethod.trimEnd().endsWith('.')) {
        // 메소드 체인인 경우
        const chainExpression = extractExpression(beforeMethod.substring(0, beforeMethod.lastIndexOf('.')));
        const result = inferExpressionType(chainExpression, variables, pdfLibraryClasses);
        ownerType = result.type;
        isStatic = result.isStatic;
    } else {
        // 생성자 호출인 경우 (new 키워드 확인)
        const newMatch = beforeMethod.match(/new\s*$/);
        const classInfo = pdfLibraryClasses.find(c => c.name === methodName);
        if(classInfo){
            if (newMatch) {
                ownerType = classInfo; // 생성자인 경우 메소드명이 클래스명
                isStatic = false;
            } else {
                ownerType = classInfo;
                isStatic = true;
            }
        }
    }
    
    return {
        type: 'parameter',
        ownerType,
        isStatic,
        methodName,
        paramIndex
    };
}

/**
 * 오른쪽에서 왼쪽으로 표현식 추출
 */
function extractExpression(beforeCursor: string): string {
    // 간단한 구분자들로 표현식 시작점 찾기
    const delimiters = [';', '=', ',', '{', '}'];
    let startIndex = 0;
    let braket = 0;
    
    for (let i = beforeCursor.length - 1; i >= 0; i--) {
        const char = beforeCursor[i];
        if(char === ')') {
            braket++;
        } else if(char === '(') {
            braket--;
        }
        // () 인 경우 무시
        if (braket === 0) {
            // (... , ... 이 거나, 묶여있지 않은 경우
            if (delimiters.includes(char)) {
                startIndex = i + 1;
                break;
            }
        }
        if(braket < 0) {
            // ( 인 경우
            startIndex = i + 1;
            break;
        }
        // 줄바꿈 처리 - 공백이 아닌 문자가 나올 때까지 건너뛰기
        if (char === '\n') {
            // 줄바꿈 이전의 공백이 아닌 마지막 문자 찾기
            let j = i - 1;
            while (j >= 0 && /\s/.test(beforeCursor[j])) {
                j--;
            }
            // 줄바꿈 전에 체인이 계속되는지 확인 (점, 괄호 등)
            if (j >= 0 && (beforeCursor[j] === '.' || beforeCursor[j] === ')')) {
                continue;
            } else {
                startIndex = i + 1;
                break;
            }
        }
        // new 키워드 확인
        if (i >= 3 && beforeCursor.substring(i - 3, i + 1) === 'new ') {
            startIndex = i + 1;
            break;
        }
    }
    
    return beforeCursor.substring(startIndex).replace(/\s+/g, ' ').trim();
}

/**
 * 표현식 타입 추론 (왼쪽에서 오른쪽으로)
 */
function inferExpressionType(
    expression: string,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[]
): { type: LibraryProps|undefined, isStatic: boolean } {
    if (!expression) return { type: undefined, isStatic: false };
    
    // 1. 첫 번째 식별자 찾기
    const firstMatch = expression.match(/^(\w+)/);
    if (!firstMatch) return { type: undefined, isStatic: false };
    
    const firstName = firstMatch[1];
    let currentType:LibraryProps|undefined;
    let isStatic = false;
    
    // 변수인지 확인
    const variable = variables.find(v => v.name === firstName);
    if (variable) {
        currentType = variable.type;
        isStatic = false;
    } else {
        // 클래스인지 확인
        const classInfo = pdfLibraryClasses.find(c => c.name === firstName);
        if (classInfo) {
            currentType = classInfo;
            isStatic = true;
        } else {
            return { type: undefined, isStatic: false };
        }
    }
    let typeSelected:LibraryProps = currentType
    
    // 2. 정적 변수 접근 확인 (예: Paper.A4, Color.BLUE)
    const staticVarPattern = /\.(\w+)(?!\s*\()/g; // 괄호가 없는 멤버 접근
    let staticVarMatch:RegExpExecArray | null ;
    let currentPosition = 0;
    
    while ((staticVarMatch = staticVarPattern.exec(expression)) !== null) {
        const memberName = staticVarMatch[1];
        
        // 현재 타입에서 해당 정적 변수 찾기
        const classInfo = pdfLibraryClasses.find(c => c.name === typeSelected.name);
        if (!classInfo || !classInfo.variables) break;
        
        const staticVar = classInfo.variables.find(v => 
            v.name === memberName && v.isStatic
        );
        
        if (!staticVar) break;
        
        // 정적 변수의 타입으로 업데이트
        currentType = pdfLibraryClasses.find(c => c.name === staticVar.type || c?.extend === staticVar.type);
        if(currentType) {
            typeSelected = currentType
        }
        
        // 정적 변수의 타입이 자기 자신 클래스와 같으면 인스턴스로 변경
        if (staticVar.type === classInfo.name) {
            isStatic = false;
        }
        
        currentPosition = staticVarMatch.index + staticVarMatch[0].length;
    }
    
    // 3. 메소드 체인 분석 (정적 변수 이후 부분부터)
    const remainingExpression = expression.substring(currentPosition);
    const methodPattern = /\.(\w+)\s*\([^)]*\)/g;
    let methodMatch;
    
    while ((methodMatch = methodPattern.exec(remainingExpression)) !== null) {
        const methodName = methodMatch[1];
        
        // 현재 타입에서 메소드 찾기
        const classInfo = pdfLibraryClasses.find(c => c.name === typeSelected.name);
        if (!classInfo || !classInfo.methods) break;
        
        const method = classInfo.methods.find(m => 
            m.name === methodName && 
            (isStatic ? m.isStatic : !m.isStatic)
        );
        
        if (!method) break;
        
        // 반환 타입으로 업데이트
        currentType = pdfLibraryClasses.find(c => c.name === method.returnType || c?.extend === method.returnType);
        if(currentType) {
            typeSelected = currentType
        }
        
        // static 메소드가 자기 클래스를 반환하면 이후로는 인스턴스 메소드
        if (isStatic && method.returnType === classInfo.name) {
            isStatic = false;
        }
    }
    
    return { type: typeSelected, isStatic };
}

/**
 * 매개변수 인덱스 계산
 */
function calculateParameterIndex(paramText: string): number {
    let commaCount = 0;
    let parenCount = 0;
    let inString = false;
    let stringChar = '';
    
    for (const char of paramText) {
        if ((char === '"' || char === "'") && !inString) {
            inString = true;
            stringChar = char;
        } else if (char === stringChar && inString) {
            inString = false;
            stringChar = '';
        } else if (!inString) {
            if (char === '(') parenCount++;
            else if (char === ')') parenCount--;
            else if (char === ',' && parenCount === 0) commaCount++;
        }
    }
    
    return commaCount;
}

/**
 * 추천 생성
 */
function generateSuggestions(
    context: CompletionContext,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[],
    position: Position
): languages.CompletionItem[] {
    const range:IRange | languages.CompletionItemRanges = {
        startLineNumber: position.lineNumber,
        startColumn: position.column,
        endLineNumber: position.lineNumber,
        endColumn: position.column
    };
    
    switch (context.type) {
        case 'dot':
            return generateDotSuggestions(context, pdfLibraryClasses, range);
        case 'parameter':
            return generateParameterSuggestions(context, variables, pdfLibraryClasses, range);
        case 'new':
            return generateNewSuggestions(context, pdfLibraryClasses, range);
        case 'general':
            return generateGeneralSuggestions(context, variables, pdfLibraryClasses, range);
        default:
            return [];
    }
}

/**
 * 점(.) 이후 멤버 추천
 */
function generateDotSuggestions(
    context: CompletionContext,
    pdfLibraryClasses: LibraryProps[],
    range: any
): languages.CompletionItem[] {
    if (!context.ownerType) return [];
    var ownerType:LibraryProps = context.ownerType
    
    const classInfo = pdfLibraryClasses.filter(c => c.name === ownerType.name || c?.extend === ownerType.name);
    if (!classInfo) return [];
    
    const suggestions: languages.CompletionItem[] = [];
    for(const info of classInfo) {
        // 메소드 추가
        if (info.methods) {
            const methods = info.methods.filter(m => 
                context.isStatic ? m.isStatic : !m.isStatic
            );
            
            suggestions.push(...methods.map(method => createMethodSuggestion(method, range)));
        }
        
        // 변수/상수 추가
        if (info.variables) {
            const vars = info.variables.filter(v => 
                context.isStatic ? v.isStatic : !v.isStatic
            );
            
            suggestions.push(...vars.map(variable => createVariableSuggestion(variable, range)));
        }
    }
    
    return suggestions;
}

/**
 * 매개변수 추천
 */
function generateParameterSuggestions(
    context: CompletionContext,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[],
    range: IRange | languages.CompletionItemRanges
): languages.CompletionItem[] {
    if (!context.ownerType || !context.methodName || context.paramIndex === undefined) {
        return [];
    }
    var ownerType:LibraryProps = context.ownerType
    var paramIndex:number = context.paramIndex
    
    const classInfo = pdfLibraryClasses.filter(c => c.name === ownerType.name || c?.extend === ownerType.name);
    if (!classInfo) return [];
    
    const suggestions: languages.CompletionItem[] = [];
    for(const info of classInfo) {
        // 메소드 또는 생성자에서 매개변수 타입 찾기
        let paramType = '';
        
        if (context.methodName === info.name && info.constructors) {
            // 생성자
            const constructor = info.constructors.find(c => 
                c.params.length > paramIndex
            );
            if (constructor) {
                paramType = constructor.params[paramIndex];
            }
        } else if (info.methods) {
            // 메소드
            const method = info.methods.find(m => 
                m.name === context.methodName && 
                m.params.length > paramIndex &&
                (context.isStatic ? m.isStatic : !m.isStatic)
            );
            if (method) {
                paramType = method.params[paramIndex];
            }
        }
        
        if (!paramType) return [];
        
        // 1. 타입이 일치하는 변수들
        variables.filter(v => v.type.name === paramType || v.type?.extend === paramType).forEach(variable => {
            suggestions.push({
                label: variable.name,
                kind: languages.CompletionItemKind.Variable,
                insertText: variable.name,
                detail: `${variable.type} ${variable.name}`,
                range
            });
        });

        // 2. int 값들
        if(paramType === 'int' && 
            (
                context.methodName === 'fromResource' ||
                context.methodName === 'setFontFromResource'
            )){
            const RClass = pdfLibraryClasses.find(c => 
                c.type === 'Enum' && c.name === 'ResourceId'
            )
            if (RClass && RClass.variables) {
                RClass.variables.filter(v => v.isStatic).forEach(enumValue => {
                    suggestions.push({
                        label: `R.id.${enumValue.name}`,
                        kind: languages.CompletionItemKind.Constant,
                        insertText: `R.id.${enumValue.name}`,
                        detail: `R.id.${enumValue.name}`,
                        documentation: enumValue.document,
                        range
                    });
                });
            }
        }
        
        // 3. Enum 값들
        const enumClass = pdfLibraryClasses.find(c => 
            c.type === 'Enum' && c.name === paramType
        );
        if (enumClass && enumClass.variables) {
            enumClass.variables.filter(v => v.isStatic).forEach(enumValue => {
                suggestions.push({
                    label: `${enumClass.name}.${enumValue.name}`,
                    kind: languages.CompletionItemKind.EnumMember,
                    insertText: `${enumClass.name}.${enumValue.name}`,
                    detail: `${enumClass.name}.${enumValue.name}`,
                    documentation: enumValue.document,
                    range
                });
            });
        }
        
        // 4. 정적 메소드 (해당 타입을 반환하는)
        pdfLibraryClasses.forEach(classInfo => {
            if (classInfo.methods) {
                classInfo.methods.filter(m => {
                    const info = pdfLibraryClasses.find(i => i.name == m.returnType)
                    if(info) {
                        return m.isStatic && (info.name === paramType || info.extend === paramType)
                    }
                    return false
                }
                ).forEach(method => {
                    suggestions.push({
                        label: `${classInfo.name}.${method.name}`,
                        kind: languages.CompletionItemKind.Method,
                        insertText: method.params.length > 0 ? 
                            `${classInfo.name}.${method.name}($0)` : 
                            `${classInfo.name}.${method.name}()`,
                        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        detail: `${classInfo.name}.${method.name}(${method.params.join(', ')})`,
                        documentation: `반환 타입: ${method.returnType}`,
                        range,
                        command: method.params.length > 0 ? {
                            id: 'editor.action.triggerSuggest',
                            title: 'Suggest'
                        } : undefined
                    });
                });
            }
        });
    }

    return suggestions;
}

/**
 * new 키워드 이후 클래스 추천
 */
function generateNewSuggestions(
    context: CompletionContext,
    pdfLibraryClasses: LibraryProps[],
    range: IRange | languages.CompletionItemRanges
): languages.CompletionItem[] {
    const query = context.query?.toLowerCase() || '';
    
    return pdfLibraryClasses
        .filter(c => 
            c.type === 'Class' && 
            c.constructors && 
            c.name.toLowerCase().startsWith(query)
        )
        .map(classInfo => {
            const constructor = classInfo.constructors![0];
            return {
                label: classInfo.name,
                kind: languages.CompletionItemKind.Constructor,
                insertText: constructor.params.length > 0 ? 
                    `${classInfo.name}($0)` : 
                    `${classInfo.name}()`,
                insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
                detail: `${classInfo.name}(${constructor.params.join(', ')})`,
                range,
                command: constructor.params.length > 0 ? {
                    id: 'editor.action.triggerSuggest',
                    title: 'Suggest'
                } : undefined
            };
        });
}

/**
 * 일반 추천 (클래스명, 변수명)
 */
function generateGeneralSuggestions(
    context: CompletionContext,
    variables: Variable[],
    pdfLibraryClasses: LibraryProps[],
    range: IRange | languages.CompletionItemRanges
): languages.CompletionItem[] {
    const query = context.query?.toLowerCase() || '';
    const suggestions: languages.CompletionItem[] = [];
    
    // 클래스/Enum 추천
    pdfLibraryClasses
        .filter(c => c.name.toLowerCase().startsWith(query))
        .forEach(classInfo => {
            suggestions.push({
                label: classInfo.name,
                kind: classInfo.type === 'Class' ? 
                    languages.CompletionItemKind.Class : 
                    languages.CompletionItemKind.Enum,
                insertText: classInfo.name,
                detail: `${classInfo.type} ${classInfo.name}`,
                range
            });
        });
    
    // 변수 추천
    variables
        .filter(v => v.name !== 'context' && v.name.toLowerCase().startsWith(query))
        .forEach(variable => {
            suggestions.push({
                label: variable.name,
                kind: languages.CompletionItemKind.Variable,
                insertText: variable.name,
                detail: `${variable.type} ${variable.name}`,
                range
            });
        });
    
    return suggestions;
}

/**
 * 메소드 추천 항목 생성
 */
function createMethodSuggestion(method: LibMethod, range: IRange | languages.CompletionItemRanges): languages.CompletionItem {
    return {
        label: method.name,
        kind: languages.CompletionItemKind.Method,
        insertText: method.params.length > 0 ? `${method.name}($0)` : `${method.name}()`,
        insertTextRules: languages.CompletionItemInsertTextRule.InsertAsSnippet,
        detail: `${method.name}(${method.params.join(', ')})`,
        documentation: `반환 타입: ${method.returnType}${method.document ? '\n\n' + method.document : ''}`,
        range,
        command: method.params.length > 0 ? {
            id: 'editor.action.triggerSuggest',
            title: 'Suggest'
        } : undefined
    };
}

/**
 * 변수 추천 항목 생성
 */
function createVariableSuggestion(variable: LibVariable, range: IRange | languages.CompletionItemRanges): languages.CompletionItem {
    return {
        label: variable.name,
        kind: variable.isStatic ? 
            languages.CompletionItemKind.EnumMember : 
            languages.CompletionItemKind.Field,
        insertText: variable.name,
        detail: `${variable.type} ${variable.name}`,
        documentation: variable.document,
        range
    };
}