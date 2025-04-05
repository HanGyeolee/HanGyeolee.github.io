import { randomUUID } from "crypto";
import { Color, Fit, LibraryProps, PDFFont, TextAlign } from "./enum.tsx";
import { IPDFComponent, PDFComponent } from "./PDFComponent.tsx";

export class PDFImage extends PDFComponent {
    src: string;
    fit: Fit;
    compress: boolean;
    resizedWidth: number;
    resizedHeight: number;
    gapX: number;
    gapY: number;

    constructor(src: string) {
        super();
        this.src = src;
        this.compress = false;
        this.fit = Fit.NONE;
        this.style = {
            maxWidth: '100%',
            boxSizing: 'border-box'
        };
    }

    draw(): string {
        // 이미지 요소를 HTML로 변환
        let imgStyle = this.styleToString();
        
        // fit 속성에 따라 CSS object-fit 속성 추가
        switch (this.fit) {
            case Fit.FILL:
                imgStyle += ' object-fit: fill;';
                break;
            case Fit.CONTAIN:
                imgStyle += ' object-fit: contain;';
                break;
            case Fit.COVER:
                imgStyle += ' object-fit: cover;';
                break;
        }
        
        return `<img src="${this.src}" style="${imgStyle}" class="pdf-image" alt="PDF Image" />`;
    }

    /**
     * Layout 안에 있는 이미지의 가로 길이는 부모의 가로 길이로 무조건 적용된다.
     * @param height 세로 크기
     * @return 자기 자신
     */
    setHeight(height: number): PDFImage {
        super.setSize(null, height);
        return this;
    }

    /**
     * 이미지 압축 여부 설정
     * 웹 환경에서는 실제 압축 대신 플래그만 설정
     * @param compress 압축 허용 여부
     * @return 자기자신
     */
    setCompress(compress: boolean): PDFImage {
        this.compress = compress;
        return this;
    }

    /**
     * 컴포넌트의 크기를 기준으로 이미지 확대, 축소 조건 설정
     * @param fit 조건
     * @return 자기자신
     */
    setFit(fit: Fit): PDFImage {
        this.fit = fit;
        return this;
    }

    // 상속 메서드 오버라이드
    setSize(width: number | null, height: number | null): PDFImage {
        super.setSize(width, height);
        return this;
    }

    setBackgroundColor(color: Color): PDFImage {
        super.setBackgroundColor(color);
        return this;
    }

    setMargin(all: number): PDFImage;
    setMargin(horizontal: number, vertical: number): PDFImage;
    setMargin(left: number, top: number, right: number, bottom: number): PDFImage;
    setMargin(left: number, top?: number, right?: number, bottom?: number): PDFImage {
        if(top&&right&&bottom)
            super.setMargin(left, top, right, bottom);
        else if(top){
            super.setMargin(left, top);
        }else{
            super.setMargin(left);
        }
        return this;
    }

    setPadding(all: number): PDFImage;
    setPadding(horizontal: number, vertical: number): PDFImage;
    setPadding(left: number, top: number, right: number, bottom: number): PDFImage;
    setPadding(left: number, top?: number, right?: number, bottom?: number): PDFImage {
        if(top&&right&&bottom)
            super.setMargin(left, top, right, bottom);
        else if(top){
            super.setMargin(left, top);
        }else{
            super.setMargin(left);
        }
        return this;
    }

    setBorder(action: Function): PDFImage;
    setBorder(size: number, color: Color): PDFImage;
    setBorder(size: number | Function, color?: Color): PDFImage {
        if(typeof size === 'number'){
            if(color)
                super.setBorder(size, color);
        }else{
            super.setBorder(size);
        }
        return this;
    }

    setParent(parent: IPDFComponent): PDFImage {
        super.setParent(parent);
        return this;
    }

    // 정적 팩토리 메서드
    static fromResource(context: any, resourceId: string): PDFImage;
    static fromResource(context: any, resourceId: string, fit: Fit): PDFImage;
    static fromResource(context: any, resourceId: string, fit?: Fit): PDFImage {
        if(fit){
            const image = PDFImage.fromResource(context, resourceId);
            return image.setFit(fit);
        } else {
            let url:string = resourceId;
            if (window.uploadedFiles && window.uploadedFiles.resource) {
                url = window.uploadedFiles.resource.find(file => file.name === resourceId).url;
            }
            return new PDFImage(url);
        }
    }

    static fromFile(path: string): PDFImage;
    static fromFile(path: string, fit: Fit): PDFImage;
    static fromFile(path: string, fit?: Fit): PDFImage {
        if(fit){
            const image = PDFImage.fromFile(path);
            return image.setFit(fit);
        } else {
            let url:string = path;
            if(window.uploadedFiles && window.uploadedFiles.file){
                url = window.uploadedFiles.file.find(file => file.name === path).url;
            }
            return new PDFImage(url);
        }
    }

    static fromAsset(context: any, assetPath: string): PDFImage;
    static fromAsset(context: any, assetPath: string, fit: Fit): PDFImage;
    static fromAsset(context: any, assetPath: string, fit?: Fit): PDFImage{
        if(fit){
            const image = PDFImage.fromAsset(context, assetPath);
            return image.setFit(fit);
        } else {
            let url:string = assetPath;
            if(window.uploadedFiles && window.uploadedFiles.assets){
                url = window.uploadedFiles.assets.find(file => file.name === assetPath).url;
            }
            return new PDFImage(assetPath);
        }
    }

    // 라이브러리 메타데이터
    static toLibrary(): LibraryProps {
        return {
            type: 'Class',
            name: 'PDFImage',
            extend: 'PDFComponent',
            methods: [
                { name: 'draw', returnType: 'string', params: [] },
                { name: 'setHeight', returnType: 'PDFImage', params: ['Number'] },
                { name: 'setCompress', returnType: 'PDFImage', params: ['boolean'] },
                { name: 'setFit', returnType: 'PDFImage', params: ['Fit'] },
                { name: 'setSize', returnType: 'PDFImage', params: ['Number', 'Number'] },
                { name: 'setBackgroundColor', returnType: 'PDFImage', params: ['Color'] },
                { name: 'setMargin', returnType: 'PDFImage', params: ['float'] },
                { name: 'setMargin', returnType: 'PDFImage', params: ['float', 'float'] },
                { name: 'setMargin', returnType: 'PDFImage', params: ['float', 'float', 'float', 'float'] },
                { name: 'setPadding', returnType: 'PDFImage', params: ['float'] },
                { name: 'setPadding', returnType: 'PDFImage', params: ['float', 'float'] },
                { name: 'setPadding', returnType: 'PDFImage', params: ['float', 'float', 'float', 'float'] },
                { name: 'setBorder', returnType: 'PDFImage', params: ['Action'] },
                { name: 'setBorder', returnType: 'PDFImage', params: ['float', 'Color'] },
                { name: 'setParent', returnType: 'PDFImage', params: ['PDFComponent'] },
                { name: 'fromResource', isStatic: true, returnType: 'PDFImage', params: ['Context', 'int'] },
                { name: 'fromResource', isStatic: true, returnType: 'PDFImage', params: ['Context', 'int', 'Fit'] },
                { name: 'fromFile', isStatic: true, returnType: 'PDFImage', params: ['String'] },
                { name: 'fromFile', isStatic: true, returnType: 'PDFImage', params: ['String', 'Fit'] },
                { name: 'fromAsset', isStatic: true, returnType: 'PDFImage', params: ['Context', 'String'] },
                { name: 'fromAsset', isStatic: true, returnType: 'PDFImage', params: ['Context', 'String', 'Fit'] }
            ],
            variableDeclaration: /PDFImage\s+(\w+)\s*=/g,
            staticMethods: /PDFImage\.(fromResource|fromFile|fromAsset)/g,
            methodChain: /(\w+)\.(setHeight|setCompress|setFit|setSize|setBackgroundColor|setMargin|setPadding|setBorder|setParent)\(.*\)/g
        };
    }
}

export class PDFText extends PDFComponent {
    text: string;
    fontFamily: string;
    fontSize: number;
    fit: Fit;

    constructor(text: string, fontFamily: string = PDFFont.HELVETICA) {
        super();
        this.text = text;
        this.fontFamily = fontFamily;
        this.fontSize = 16;
        this.fit = Fit.NONE;
        this.style = {
            fontSize: this.fontSize + 'px',
            fontFamily: fontFamily,
            margin: '0',
            padding: '5px',
            boxSizing: 'border-box',
            wordWrap: 'break-word'
        };
    }

    draw(): string {
        // 텍스트를 HTML로 변환
        // 줄바꿈 처리
        const formattedText = this.text.replace(/\n/g, '<br>');
        return `<div style="${this.styleToString()}" class="pdf-text">${formattedText}</div>`;
    }

    /**
     * 텍스트 내용 설정
     * @param text 텍스트
     * @return 자기자신
     */
    setText(text: string): PDFText {
        this.text = text;
        return this;
    }

    /**
     * 텍스트 색상 설정
     * @param color 색상
     * @return 자기자신
     */
    setTextColor(color: Color): PDFText {
        this.style.color = color;
        return this;
    }

    /**
     * 폰트 설정
     * @param fontFamily 폰트
     * @return 자기자신
     */
    setFont(fontFamily: string): PDFText {
        this.fontFamily = fontFamily;
        this.style.fontFamily = fontFamily;
        return this;
    }

    /**
     * 폰트 크기 설정
     * @param fontSize 폰트 크기
     * @return 자기자신
     */
    setFontsize(fontSize: number): PDFText {
        this.fontSize = fontSize;
        this.style.fontSize = fontSize + 'px';
        return this;
    }

    /**
     * 텍스트 정렬 설정
     * @param align 정렬
     * @return 자기자신
     */
    setTextAlign(align: TextAlign): PDFText {
        switch(align){
            case TextAlign.Start:
                this.style.textAlign = "start";
                break;
            case TextAlign.End:
                this.style.textAlign = "end";
                break;
            case TextAlign.Left:
                this.style.textAlign = "left";
                break;
            case TextAlign.Right:
                this.style.textAlign = "right";
                break;
            case TextAlign.Center:
                this.style.textAlign = "center";
                break;
            case TextAlign.Justify:
                this.style.textAlign = "justify";
                break;
        }
        return this;
    }

    /**
     * 컴포넌트의 크기를 기준으로 텍스트 확대, 축소 조건 설정
     * @param fit 조건
     * @return 자기자신
     */
    setFit(fit: Fit): PDFText {
        this.fit = fit;
        return this;
    }

    // 폰트 등록 헬퍼 메서드
    private registerFont(url: string, fontName: string): string {
        // 고유 폰트 ID 생성
        const fontId = `pdf-font-${Math.random().toString(36).substring(2, 9)}`;
        
        // 스타일 태그 생성 및 @font-face 규칙 추가
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: '${fontId}';
                src: url('${url}') format('truetype');
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(style);
        
        // 폰트 ID 저장 및 반환
        return fontId;
    }

    /**
     * 외부 폰트 로드
     * 웹 환경에서는 실제 폰트 대신 기본 폰트 사용
     * @param context 컨텍스트
     * @param assetPath 에셋 경로
     * @return 자기자신
     */
    setFontFromAsset(context: any, assetPath: string): PDFText {
        if (window.uploadedFiles && window.uploadedFiles.assets) {
            const fontFile = window.uploadedFiles.assets.find(file => file.name === assetPath);
            if (fontFile && fontFile.url) {
                // 폰트 등록 및 적용
                const fontId = this.registerFont(fontFile.url, assetPath);
                this.style.fontFamily = `'${fontId}', Arial, sans-serif`;
            }
        }
        return this;
    }

    /**
     * 파일 시스템에서 폰트 로드
     * @param path 폰트 파일 경로
     * @return 자기자신
     */
    setFontFromFile(path: string): PDFText {
        if (window.uploadedFiles && window.uploadedFiles.file) {
            const fontFile = window.uploadedFiles.file.find(file => file.name === path);
            if (fontFile && fontFile.url) {
                // 폰트 등록 및 적용
                const fontId = this.registerFont(fontFile.url, path);
                this.style.fontFamily = `'${fontId}', Arial, sans-serif`;
            }
        }
        return this;
    }

    /**
     * 리소스에서 폰트 로드
     * @param context 컨텍스트
     * @param resourceId 리소스 ID
     * @return 자기자신
     */
    setFontFromResource(context: any, resourceId: string): PDFText {
        if (window.uploadedFiles && window.uploadedFiles.resource) {
            const fontFile = window.uploadedFiles.resource.find(file => file.name === resourceId);
            if (fontFile && fontFile.url) {
                // 폰트 등록 및 적용
                const fontId = this.registerFont(fontFile.url, resourceId);
                this.style.fontFamily = `'${fontId}', Arial, sans-serif`;
            }
        }
        return this;
    }

    // 상속 메서드 오버라이드
    setSize(width: number | null, height: number | null): PDFText {
        super.setSize(width, height);
        return this;
    }

    setBackgroundColor(color: Color): PDFText {
        super.setBackgroundColor(color);
        return this;
    }

    setMargin(all: number): PDFText;
    setMargin(horizontal: number, vertical: number): PDFText;
    setMargin(left: number, top: number, right: number, bottom: number): PDFText;
    setMargin(left: number, top?: number, right?: number, bottom?: number): PDFText {
        if(top && right && bottom)
            super.setMargin(left, top, right, bottom);
        else if(top)
            super.setMargin(left, top);
        else
            super.setMargin(left);
        return this;
    }

    setPadding(all: number): PDFText;
    setPadding(horizontal: number, vertical: number): PDFText;
    setPadding(left: number, top: number, right: number, bottom: number): PDFText;
    setPadding(left: number, top?: number, right?: number, bottom?: number): PDFText {
        if(top && right && bottom)
            super.setPadding(left, top, right, bottom);
        else if(top)
            super.setPadding(left, top);
        else
            super.setPadding(left);
        return this;
    }

    setBorder(action: Function): PDFText;
    setBorder(size: number, color: Color): PDFText;
    setBorder(size: number | Function, color?: Color): PDFText {
        if(typeof size === 'number'){
            if(color)
                super.setBorder(size, color);
        }else{
            super.setBorder(size);
        }
        return this;
    }

    setParent(parent: IPDFComponent): PDFText {
        super.setParent(parent);
        return this;
    }

    // 정적 팩토리 메서드
    static build(text: string): PDFText;
    static build(text: string, fontFamily: string): PDFText;
    static build(text: string, fontFamily?: string): PDFText {
        if(fontFamily) {
            return new PDFText(text, fontFamily);
        } else {
            return new PDFText(text);
        }
    }

    // 라이브러리 메타데이터
    static toLibrary(): LibraryProps {
        return {
            type: 'Class',
            name: 'PDFText',
            extend: 'PDFComponent',
            methods: [
                { name: 'draw', returnType: 'string', params: [] },
                { name: 'setText', returnType: 'PDFText', params: ['String'] },
                { name: 'setTextColor', returnType: 'PDFText', params: ['Color'] },
                { name: 'setFont', returnType: 'PDFText', params: ['String'] },
                { name: 'setFontsize', returnType: 'PDFText', params: ['float'] },
                { name: 'setTextAlign', returnType: 'PDFText', params: ['TextAlign'] },
                { name: 'setFit', returnType: 'PDFText', params: ['Fit'] },
                { name: 'setFontFromAsset', returnType: 'PDFText', params: ['Context', 'String'] },
                { name: 'setFontFromFile', returnType: 'PDFText', params: ['String'] },
                { name: 'setFontFromResource', returnType: 'PDFText', params: ['Context', 'int'] },
                { name: 'setSize', returnType: 'PDFText', params: ['Number', 'Number'] },
                { name: 'setBackgroundColor', returnType: 'PDFText', params: ['Color'] },
                { name: 'setMargin', returnType: 'PDFText', params: ['float'] },
                { name: 'setMargin', returnType: 'PDFText', params: ['float', 'float'] },
                { name: 'setMargin', returnType: 'PDFText', params: ['float', 'float', 'float', 'float'] },
                { name: 'setPadding', returnType: 'PDFText', params: ['float'] },
                { name: 'setPadding', returnType: 'PDFText', params: ['float', 'float'] },
                { name: 'setPadding', returnType: 'PDFText', params: ['float', 'float', 'float', 'float'] },
                { name: 'setBorder', returnType: 'PDFText', params: ['Action'] },
                { name: 'setBorder', returnType: 'PDFText', params: ['float', 'Color'] },
                { name: 'setParent', returnType: 'PDFText', params: ['PDFComponent'] },
                { name: 'build', isStatic: true, returnType: 'PDFText', params: ['String'] },
                { name: 'build', isStatic: true, returnType: 'PDFText', params: ['String', 'String'] }
            ],
            variableDeclaration: /PDFText\s+(\w+)\s*=/g,
            staticMethods: /PDFText\.(build)/g,
            methodChain: /(\w+)\.(setText|setTextColor|setFont|setFontsize|setTextAlign|setFit|setFontFromAsset|setFontFromFile|setFontFromResource|setSize|setBackgroundColor|setMargin|setPadding|setBorder|setParent)\(.*\)/g
        };
    }
}