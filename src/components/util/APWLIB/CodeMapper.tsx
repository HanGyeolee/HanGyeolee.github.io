import { CstElement, CstNode, IToken, parse } from 'java-parser';
import { LibraryProps, Paper, PaperUnit, PDFColorLibrary, PDFFitLibrary, PDFFontLibrary, PDFOrientationLibrary, PDFTextAlignLibrary } from './enum.tsx';
import { PDFComponent } from './PDFComponent.tsx';
import { PDFGridLayout, PDFLinearLayout } from './PDFLayout.tsx';
import { PDFH1, PDFH2, PDFH3, PDFH4, PDFH5, PDFH6, PDFImage, PDFText } from './PDFResource.tsx';
import { PageLayoutFactory, PDFPageLayout, RectF } from './PDFPageLayout.tsx';
import { PDFBuilder } from './PDFBuilder.tsx';

const DEBUG = false;

// PDF 라이브러리 클래스 및 메서드 정보
export const pdfLibraryClasses:LibraryProps[] = [
    // PDFComponent.tsx
    PDFComponent.toLibrary(),
    // PDFLayout.tsx
    PDFLinearLayout.toLibrary(),
    PDFGridLayout.toLibrary(),
    // PDFResource.tsx
    PDFImage.toLibrary(),
    PDFText.toLibrary(),
    PDFH1.toLibrary(),
    PDFH2.toLibrary(),
    PDFH3.toLibrary(),
    PDFH4.toLibrary(),
    PDFH5.toLibrary(),
    PDFH6.toLibrary(),
    // PDFPageLayout.tsx
    RectF.toLibrary(),
    PDFPageLayout.toLibrary(),
    PageLayoutFactory.toLibrary(),
    // PDFBuilder.tsx
    PDFBuilder.toLibrary(),
    // enum.tsx
    PDFColorLibrary,
    PDFFontLibrary,
    PDFTextAlignLibrary,
    PDFFitLibrary,
    PDFOrientationLibrary,
    PaperUnit.toLibrary(),
    Paper.toLibrary(),
];

export function codeMapping(javaCode:string):{[key: string]: any} {
    // 변수 저장소
    const vars: {[key: string]: any} = {
        'context':null
    };

    javaCode = javaCode.replace(/R\.id\.(\w+)/, '"R.id.$1"')

    const javaText = `
    public class ForParser{
        public static void main(String args[]){
            ${javaCode}
        }
    }
    `;
  
    try {
        // Java 코드를 AST로 파싱
        const ast:CstNode = parse(javaText);
        
        // // AST 순회 및 평가
        processAST(ast, vars);
        
        return vars;
    } catch (error) {
        console.error("자바 코드 변환 중 오류:", error);
        return vars;
    }

    // AST 순회 함수
    function processAST(node: CstElement, vars: { [key: string]: any }) {
        // 토큰인 경우 처리 중단
        if (!isCstNode(node)) return;
        
        // 노드 타입에 따라 처리
        if (hasNodeName(node, "variableDeclarator")) {
            processVariableDeclarator(node, vars);
        }
        else if (hasNodeName(node, "expressionStatement")) {
            processExpressionStatement(node, vars);
        }
        else if (hasNodeName(node, "localVariableDeclaration")) {
            processLocalVarialbleDeclaration(node, vars);
        }else {
            if(DEBUG)
            console.log("자식 노드 처리")
            if (node.children) {
                for (const key in node.children) {
                    const childElements = node.children[key];
                    if (Array.isArray(childElements)) {
                        childElements.forEach(child => processAST(child, vars));
                    }
                }
            }
        }
    }
    // 노드 타입 검사 유틸리티 함수
    function isCstNode(element: CstElement): element is CstNode {
      return (element as CstNode).children !== undefined;
    }
    // isIToken 타입 가드 함수
    function isIToken(element: CstElement): element is IToken {
        return (element as IToken).image !== undefined;
    }
    function hasNodeName(node: CstNode, name: string): boolean {
        return node.name === name;
    }
    function getTokenImage(element: CstElement): string | null {
        if (isIToken(element)) {
            return element.image;
        }
        return null;
    }
    // 지역 변수 선언 처리
    function processLocalVarialbleDeclaration(node: CstNode, vars: { [key:string]:any }){
        const varDeclList = node.children.variableDeclaratorList;
        if(!varDeclList || !varDeclList.length) return;

        const varDecl = varDeclList[0];
        if (!isCstNode(varDecl)) return;
        
        const varDeclarators = varDecl.children.variableDeclarator;
        if (!varDeclarators || !varDeclarators.length) return;
        
        varDeclarators.forEach(declarator => {
            if (isCstNode(declarator)) {
                processVariableDeclarator(declarator, vars);
            }
        });
    }
    // 변수 선언자 처리
    function processVariableDeclarator(node: CstNode, vars: { [key: string]: any }) {
        // 변수 이름 추출
        const varName = extractVariableName(node);
        if (!varName) return;
        
        // 초기화 표현식 평가
        const value = evaluateInitializer(node, vars);
        if (value !== undefined) {
            vars[varName] = value;
            if(DEBUG)
            console.log('초기화 표현식:',vars)
        }
    }
    // 변수명 추출
    function extractVariableName(node: CstNode): string | null {
        const varIdNodes = node.children.variableDeclaratorId;
        if (!varIdNodes || !varIdNodes.length) return null;
        
        const varIdNode = varIdNodes[0];
        if (!isCstNode(varIdNode)) return null;
        
        const identifiers = varIdNode.children.Identifier;
        if (!identifiers || !identifiers.length) return null;
        
        const identifier = identifiers[0];
        if (isCstNode(identifier)) return null;
        
        return getTokenImage(identifier);
    }
    // 초기화 표현식 평가
    function evaluateInitializer(node: CstNode, vars: { [key: string]: any }): any {
        const initializers = node.children.variableInitializer;
        if (!initializers || !initializers.length) return undefined;
        
        const initializer = initializers[0];
        if (!isCstNode(initializer)) return undefined;
        
        // 표현식 또는 배열 초기화
        if (initializer.children.expression) {
            return evaluateExpression(initializer, vars);
        } else if (initializer.children.arrayInitializer) {
            // 배열 초기화 처리
            const arrayInit = initializer.children.arrayInitializer[0];
            if (isCstNode(arrayInit)) {
                return evaluateArrayInitializer(arrayInit, vars);
            }
        }
        
        return undefined;
    }
    // 배열 초기화 평가
    function evaluateArrayInitializer(node: CstNode, vars: { [key: string]: any }): any[] {
        const varInitListNodes = node.children.variableInitializerList;
        if (!varInitListNodes || !varInitListNodes.length) return [];
        
        const result: any[] = [];
        const varInitList = varInitListNodes[0];
        
        if (isCstNode(varInitList) && varInitList.children.variableInitializer) {
            varInitList.children.variableInitializer.forEach(initializer => {
                if (isCstNode(initializer)) {
                    const value = evaluateInitializer(initializer, vars);
                    if (value !== undefined) {
                        result.push(value);
                    }
                }
            });
        }
        
        return result;
    }
    // 표현식 문 처리
    function processExpressionStatement(node: CstNode, vars: { [key: string]: any }) {
        const stmtExps = node.children.statementExpression;
        if (!stmtExps || !stmtExps.length) return;
        
        const stmtExp = stmtExps[0];
        if (!isCstNode(stmtExp)) return;
        
        return evaluateExpression(stmtExp, vars);
    }
    // 표현식 평가
    function evaluateExpression(node: CstNode, vars: { [key: string]: any }): any {
        // 표현식 종류에 따라 처리
        if (node.children.expression && node.children.expression.length) {
            const expr = node.children.expression[0];
            if (isCstNode(expr)) {
                return evaluateExpression(expr, vars);
            }
        }
        
        if (node.children.conditionalExpression && node.children.conditionalExpression.length) {
            const condExpr = node.children.conditionalExpression[0];
            if (isCstNode(condExpr)) {
                return evaluateConditionalExpression(condExpr, vars);
            }
        }
        
        if (node.children.primary && node.children.primary.length) {
            const primary = node.children.primary[0];
            if (isCstNode(primary)) {
                return evaluatePrimary(primary, vars);
            }
        }
        
        if (node.children.lambdaExpression && node.children.lambdaExpression.length) {
            // Lambda 표현식 처리 (필요에 따라 구현)
        }
        return undefined;
    }
    // 조건 표현식 평가
    function evaluateConditionalExpression(node: CstNode, vars: { [key: string]: any }): any {
        if (!node.children.binaryExpression || !node.children.binaryExpression.length) 
            return undefined;
        
        const binExpr = node.children.binaryExpression[0];
        if (!isCstNode(binExpr)) return undefined;
        
        // 이항 표현식 평가
        return evaluateBinaryExpression(binExpr, vars);
    }
    // 이항 표현식 평가
    function evaluateBinaryExpression(node: CstNode, vars: { [key: string]: any }): any {
        // 단항 표현식만 지원 (간단화)
        if (!node.children.unaryExpression || !node.children.unaryExpression.length)
            return undefined;
        
        const unaryExpr = node.children.unaryExpression[0];
        if (!isCstNode(unaryExpr)) return undefined;
        
        // 단항 표현식 평가
        return evaluateUnaryExpression(unaryExpr, vars);
    }
    // 단항 표현식 평가
    function evaluateUnaryExpression(node: CstNode, vars: { [key: string]: any }): any {
        if (!node.children.primary || !node.children.primary.length)
            return undefined;
        
        const primary = node.children.primary[0];
        if (!isCstNode(primary)) return undefined;
        
        // 기본 표현식 평가
        return evaluatePrimary(primary, vars);
    }
    // 기본 표현식 평가
    function evaluatePrimary(node: CstNode, vars: { [key: string]: any }): any {
        // 접두사 확인
        if (!node.children.primaryPrefix || !node.children.primaryPrefix.length) 
            return undefined;
        
        const prefix = node.children.primaryPrefix[0];
        if (!isCstNode(prefix)) return undefined;
        
        // 리터럴 (문자열, 숫자 등)
        if (prefix.children.literal) {
            return evaluateLiteral(prefix.children.literal[0], vars);
        }
        
        // 변수 참조 또는 클래스 참조
        if (prefix.children.fqnOrRefType) {
            const refType = prefix.children.fqnOrRefType[0];
            if (isCstNode(refType)){
                const {First, Rest} = extractReferenceName(refType);
                const className = First;
                const memberNames = Rest;
        
                if (className){
                    if(memberNames&&memberNames.length){
                        if(node.children.primarySuffix && node.children.primarySuffix.length){
                            const suffix = node.children.primarySuffix[0];
                            if (isCstNode(suffix)) {
                                if (suffix.children.methodInvocationSuffix && 
                                    suffix.children.methodInvocationSuffix.length) {
                                    const args = evaluateMethodArguments(suffix.children.methodInvocationSuffix[0], vars);
                                    let result:any;
                                    if(args && args.length){
                                        if(findLibraryClass(className)) {
                                            // 정적 메소드 호출 패턴 확인 (ClassName.method(args))
                                            result = evaluateStaticMethodCall(className, memberNames, args);
                                        } else {
                                            // 변수로 부터 메소드 호출
                                            const obj = evaluateReference(refType, vars);
                                            result = obj;
                                            for(const member of memberNames){
                                                if(member){
                                                    if(typeof result[member] === 'function'){
                                                        result = result[member](...args);
                                                    }else{
                                                        result = result[member];
                                                    }
                                                }
                                            }
                                        }
                                    } else {
                                        const obj = evaluateReference(refType, vars);
                                        if((obj as LibraryProps).object){
                                            const objClass = (obj as LibraryProps).object;
                                            result = objClass;
                                            for(const member of memberNames){
                                                if(member){
                                                    if(typeof result[member] === 'function'){
                                                        result = result[member]();
                                                    }else{
                                                        result = result[member];
                                                    }
                                                }
                                            }
                                        }
                                    }

                                    // 메소드 체인 처리 (남은 suffix가 있다면)
                                    if (result && node.children.primarySuffix.length > 1) {
                                        return evaluateChainedCalls(
                                            result, 
                                            node.children.primarySuffix.slice(1), 
                                            vars
                                        );
                                    }
                                    
                                    return result
                                }
                            }
                        }
                        // Enum 변수 호출 혹은 정적 변수 호출 패턴 (ClassName.Const)
                        const obj = evaluateReference(refType, vars);
                        if((obj as LibraryProps).object){
                            const objClass = (obj as LibraryProps).object;
                            let result = objClass;
                            for(const member of memberNames){
                                if(member){
                                    if(typeof result[member] === 'function'){
                                        result = result[member]();
                                    }else{
                                        result = result[member];
                                    }
                                }
                            }
                            return result;
                        }
                    } else {
                        // 변수 호출
                        const obj = evaluateReference(refType, vars);
                        if(!(obj as LibraryProps).object){
                            return obj;
                        }
                    }
                }
            }
            
            return undefined;
        }
        
        // 객체 생성 (new 표현식)
        if (prefix.children.newExpression) {
            return evaluateNewExpression(prefix.children.newExpression[0], vars);
        }
        
        // 괄호 표현식
        if (prefix.children.parenthesisExpression) {
            return evaluateParenthesisExpression(prefix.children.parenthesisExpression[0], vars);
        }
        
        return undefined;
    }
    // 리터럴 평가
    function evaluateLiteral(node: CstElement, vars: { [key: string]: any }): any {
        if (!isCstNode(node)) return undefined;
        
        // 문자열 리터럴
        if (node.children.StringLiteral) {
            const tokenImage = getTokenImage(node.children.StringLiteral[0]);
            if (tokenImage) {
                return tokenImage.substring(1, tokenImage.length - 1);
            }
            return undefined;
        }
        
        // 정수 리터럴
        if (node.children.integerLiteral) {
            const intNode = node.children.integerLiteral[0];
            if (isCstNode(intNode)) {
                if (intNode.children.DecimalLiteral) {
                    const tokenImage = getTokenImage(intNode.children.DecimalLiteral[0]);
                    if (tokenImage) {
                        return parseInt(tokenImage);
                    }
                    return undefined;
                }
                // 다른 형태의 정수 리터럴도 처리 가능
            }
        }
        
        // 부동소수점 리터럴
        if (node.children.floatingPointLiteral) {
            const floatNode = node.children.floatingPointLiteral[0];
            if (isCstNode(floatNode)) {
                if (floatNode.children.FloatLiteral) {
                    const tokenImage = getTokenImage(floatNode.children.FloatLiteral[0]);
                    if (tokenImage) {
                        return parseFloat(tokenImage);
                    }
                    return undefined;
                } else if (floatNode.children.DoubleLiteral) {
                    const tokenImage = getTokenImage(floatNode.children.DoubleLiteral[0]);
                    if (tokenImage) {
                        return parseFloat(tokenImage);
                    }
                    return undefined;
                }
            }
        }
        
        // Boolean 리터럴
        if (node.children.booleanLiteral) {
            const boolNode = node.children.booleanLiteral[0];
            if (isCstNode(boolNode)) {
                return boolNode.children.True ? true : false;
            }
        }
        
        // null 리터럴
        if (node.children.Null) {
            return null;
        }
        
        return undefined;
    }
    // 참조 평가 (변수, Enum)
    function evaluateReference(node: CstElement, vars: { [key: string]: any }): any {
        if (!isCstNode(node)) return undefined;
        
        const {First, Rest} = extractReferenceName(node);
        const varName = First;
        if (!varName) return undefined;
        
        // 변수 참조인 경우
        if (varName in vars) {
            return vars[varName];
        }
    
        // 클래스 또는 Enum 참조인 경우
        const classInfo = findLibraryClass(varName);
        if (classInfo) {
            if(DEBUG)
            console.log(`클래스 참조: ${varName}`);
            return classInfo;
        }
        
        return undefined;
    }
    // 참조 이름 추출
    function extractReferenceName(node: CstNode): {First:string | null, Rest:(string|null)[]} {
        let First:string | null = null;
        let Rest:(string|null)[]  = [];
        if(node.children.fqnOrRefTypePartFirst && node.children.fqnOrRefTypePartFirst.length){
            const firstPart = node.children.fqnOrRefTypePartFirst[0];
            if(isCstNode(firstPart)){
                const common = firstPart.children.fqnOrRefTypePartCommon[0];
                if(isCstNode(common))
                    First = getTokenImage(common.children.Identifier[0]);
            }
        }
        if(node.children.fqnOrRefTypePartRest && node.children.fqnOrRefTypePartRest.length){
            for(const restPart of node.children.fqnOrRefTypePartRest){
                if(isCstNode(restPart)){
                    const common = restPart.children.fqnOrRefTypePartCommon[0];
                    if(isCstNode(common))
                        Rest = [...Rest, getTokenImage(common.children.Identifier[0])];
                }
            }
        }

        return {First, Rest};
    }
    // 정적 메소드 호출 처리 함수 추가
    function evaluateStaticMethodCall(className: string, methodNames: (string | null)[], args: any[]): any {
        if(DEBUG)
        console.log(`정적 메소드 호출: ${className}.${methodNames}`, args);
        
        const classInfo = findLibraryClass(className);
        if (!classInfo || !classInfo.object) {
            console.error(`클래스 찾을 수 없음: ${className}`);
            return undefined;
        }

        // 정적 메소드 확인
        const classObj = classInfo.object;
        let result:any = classObj;
        for(const methodName of methodNames){
            if(methodName&&result[methodName]){
                if (typeof result[methodName] === 'function'){
                    result = result[methodName](...args);
                } else {
                    result = result[methodName];
                }
            }
        }
        
        // 정적 메소드 호출
        try {
            return result;
        } catch (error) {
            console.error(`정적 메소드 호출 오류: ${className}.${methodNames}`, error);
            return undefined;
        }

    }
    // 객체 필드 이름 추출
    function extractFieldName(node: CstNode): string | null {
        if (!node.children.Identifier || !node.children.Identifier.length)
            return null;
        
        return getTokenImage(node.children.Identifier[0]);
    }
    // 메소드 체인 및 필드 접근 평가
    function evaluateChainedCalls(obj: any, suffixes: CstElement[], vars: { [key: string]: any }): any {
        if (!obj) return undefined;
        
        let result = obj;
        
        for (let i = 0 ; i < suffixes.length; i++) {
            const suffixElem = suffixes[i];
            if (!isCstNode(suffixElem)) continue;
            
            if (suffixElem.children.Identifier && suffixElem.children.Identifier.length) {
                const fieldName = extractFieldName(suffixElem);
                if (!fieldName) continue;
                
                // 메소드 호출
                if(typeof result[fieldName] === 'function'){
                    const methodName = fieldName;
                    i += 1;
                    const suffixElem = suffixes[i];
                    if (!isCstNode(suffixElem)) continue;
                    if (suffixElem.children.methodInvocationSuffix && suffixElem.children.methodInvocationSuffix.length) {
                        const args = evaluateMethodArguments(suffixElem.children.methodInvocationSuffix[0], vars);
                        if(DEBUG)
                        console.log(`메소드 호출: ${methodName}`, args);
                    
                        result = result[methodName](...args);
                    }
                } else {
                    // 필드 접근
                    result = result[fieldName];
                }
            }
        }
        
        return result;
    }
    // 메소드 인자 평가
    function evaluateMethodArguments(node: CstElement, vars: { [key: string]: any }): any[] {
        if (!isCstNode(node) || !node.children.argumentList || !node.children.argumentList.length)
            return [];
        
        const argListNode = node.children.argumentList[0];
        if (!isCstNode(argListNode) || !argListNode.children.expression)
            return [];
        
        const args: any[] = [];
        
        for (const exprElem of argListNode.children.expression) {
            if (isCstNode(exprElem)) {
                const value = evaluateExpression(exprElem, vars);
                args.push(value);
            }
        }
        
        return args;
    }
    // 객체 생성 표현식 평가
    function evaluateNewExpression(node: CstElement, vars: { [key: string]: any }): any {
        if (!isCstNode(node)) return undefined;
        
        // 일반 클래스 인스턴스 생성
        if (node.children.unqualifiedClassInstanceCreationExpression && 
            node.children.unqualifiedClassInstanceCreationExpression.length) {
            const creationNode = node.children.unqualifiedClassInstanceCreationExpression[0];
            
            if (!isCstNode(creationNode) || 
                !creationNode.children.classOrInterfaceTypeToInstantiate || 
                !creationNode.children.classOrInterfaceTypeToInstantiate.length)
                return undefined;
            
            const typeNode = creationNode.children.classOrInterfaceTypeToInstantiate[0];
            if (!isCstNode(typeNode) || !typeNode.children.Identifier || !typeNode.children.Identifier.length)
                return undefined;
            
            const className = getTokenImage(typeNode.children.Identifier[0]);
            if(!className) return undefined;
            const classInfo = findLibraryClass(className);
            
            if (!classInfo || !classInfo.object) return undefined;
            
            // 생성자 인자 평가
            const args = creationNode.children.argumentList ? 
                evaluateMethodArguments(creationNode, vars) : [];
            
            // 클래스 인스턴스 생성
            return createClassInstance(classInfo, args);
        }
        
        // 배열 생성 표현식 (필요할 경우 구현)
        
        return undefined;
    }
    // 괄호 표현식 평가
    function evaluateParenthesisExpression(node: CstElement, vars: { [key: string]: any }): any {
        if (!isCstNode(node) || !node.children.expression || !node.children.expression.length)
            return undefined;
        
        if(!isCstNode(node.children.expression[0])) return undefined;
        return evaluateExpression(node.children.expression[0], vars);
    }
    // 라이브러리 클래스 찾기
    function findLibraryClass(name: string): LibraryProps | undefined {
        return pdfLibraryClasses.find(info => info.name === name);
    }
    // 클래스 인스턴스 생성
    function createClassInstance(classInfo: LibraryProps, args: any[]): any {
        try {
            if(DEBUG)
            console.log(`클래스 생성: ${classInfo.name}`, args)
            const Class = classInfo.object;
            // new 연산자로 클래스 인스턴스 생성
            return new Class(...args);
        } catch (error) {
            console.error(`'${classInfo.name}' 클래스 인스턴스 생성 오류:`, error);
            return undefined;
        }
    }
}
