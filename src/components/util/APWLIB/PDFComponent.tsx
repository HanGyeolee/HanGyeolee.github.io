import { Color, LibraryProps } from "./enum.tsx";

export interface IPDFComponent {
    draw(): string;
    styleToString(): string;
    setSize(width:number|null, height:number|null):IPDFComponent;
    setBackgroundColor(color:Color):IPDFComponent;
    setMargin(all:number):IPDFComponent;
    setMargin(horizontal:number, vertical:number):IPDFComponent;
    setMargin(left:number, top:number, right:number, bottom:number):IPDFComponent;
    setMargin(left:number, top?:number, right?:number, bottom?:number):IPDFComponent;
    setPadding(all:number):IPDFComponent;
    setPadding(horizontal:number, vertical:number):IPDFComponent;
    setPadding(left:number, top:number, right:number, bottom:number):IPDFComponent;
    setPadding(left:number, top?:number, right?:number, bottom?:number):IPDFComponent;
    setBorder(action:Function):IPDFComponent;
    setBorder(size:number, color:Color):IPDFComponent;
    setBorder(size:number|Function, color?:Color):IPDFComponent;
    setParent(parent:IPDFComponent):IPDFComponent;
    setStyleAttribute(name:string, value:any);
}

export class PDFComponent implements IPDFComponent{
    parent: IPDFComponent|null;
    style: React.CSSProperties;
    constructor() {
        this.parent = null;
        this.style = {backgroundColor:Color.TRANSPARENT};
    }

    draw() {
        return '<div>Base PDFElement</div>';
    }
  
    // CSS 스타일 객체를 문자열로 변환
    styleToString() {
      return Object.entries(this.style)
        .map(([key, value]) => `${key}: ${value};`)
        .join(' ');
    }
    
    // // GridCell로 래핑
    // wrapGridCell();
    // wrapGridCell(rowSpan:number, columnSpan:number);
    // wrapGridCell(rowSpan?:number, columnSpan?:number) {
    //     if(rowSpan&&columnSpan){
    //         return new PDFGridCell(this, rowSpan, columnSpan);
    //     } else {
    //         return new PDFGridCell(this);
    //     }
    // }

    /**
     * 컴포넌트 내의 내용(content)의 크기 설정 <br>
     * Setting the size of content within a component
     * @param width 가로 크기
     * @param height 세로 크기
     * @return 컴포넌트 자기자신
     */
    setSize(width:number|null, height:number|null):PDFComponent {
        if(width != null) {
            if(width < 0) width = 0;
            this.style.width = width;
        }
        if(height != null) {
            if(height < 0) height = 0;
            this.style.height = height;
        }
        return this;
    }
    /**
     * 컴포넌트 내의 배경의 색상 설정<br>
     * Set the color of the background within the component
     * @param color 색상
     * @return 컴포넌트 자기자신
     */
    setBackgroundColor(color:Color):PDFComponent{
        this.style.backgroundColor = color;
        return this;
    }
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param all 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(all:number):PDFComponent;
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param horizontal 가로 여백
     * @param vertical 세로 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(horizontal:number, vertical:number):PDFComponent;
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param left 왼쪽 여백
     * @param top 위쪽 여백
     * @param right 오른쪽 여백
     * @param bottom 아래쪽 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(left:number, top:number, right:number, bottom:number):PDFComponent;
    setMargin(left:number, top?:number, right?:number, bottom?:number):PDFComponent{
        if(left&&!top) {
            top = left;
            right = left;
            bottom = left;
        } else if (left&&top&&!right){
            right = left;
            bottom = top;
        }
        this.style.marginLeft = `${left}px`;
        this.style.marginTop = `${top}px`;
        this.style.marginRight = `${right}px`;
        this.style.marginBlock = `${bottom}px`;
        return this;
    }
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param all 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(all:number):PDFComponent;
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param horizontal 가로 패딩
     * @param vertical 세로 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(horizontal:number, vertical:number):PDFComponent;
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param left 왼쪽 패딩
     * @param top 위쪽 패딩
     * @param right 오른쪽 패딩
     * @param bottom 아래쪽 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(left:number, top:number, right:number, bottom:number):PDFComponent;
    setPadding(left:number, top?:number, right?:number, bottom?:number):PDFComponent{
        if(left&&!top) {
            top = left;
            right = left;
            bottom = left;
        } else if (left&&top&&!right){
            right = left;
            bottom = top;
        }
        this.style.paddingLeft = `${left}px`;
        this.style.paddingTop = `${top}px`;
        this.style.paddingRight = `${right}px`;
        this.style.paddingBottom = `${bottom}px`;
        return this;
    }
    /**
     * 테두리 굵기 및 색상 지정<br>
     * Specify border thickness and color
     * @param action 테두리 변경 함수
     */
    setBorder(action:Function):PDFComponent;
    /**
     * 테두리 굵기 및 색상 지정<br>
     * Specify border thickness and color
     * @param size 전체 테두리 굵기
     * @param color 전체 테두리 색상
     */
    setBorder(size:number, color:Color):PDFComponent;
    setBorder(size:number|Function, color?:Color):PDFComponent{
        if(typeof size === 'number'){
            this.style.border = `${size}px solid ${color}`; // 기본값
        } else {
            const action:Function = size;
            this.style.border = ''; // 기본값
            // 콜백 함수를 호출하여 border 설정
            const borderConfig = {
                setLeft: (width:number, color:Color) => {
                this.style.borderLeftWidth = width + 'px';
                this.style.borderLeftColor = color;
                this.style.borderLeftStyle = 'solid';
                return borderConfig;
                },
                setRight: (width:number, color:Color) => {
                this.style.borderRightWidth = width + 'px';
                this.style.borderRightColor = color;
                this.style.borderRightStyle = 'solid';
                return borderConfig;
                },
                setTop: (width:number, color:Color) => {
                this.style.borderTopWidth = width + 'px';
                this.style.borderTopColor = color;
                this.style.borderTopStyle = 'solid';
                return borderConfig;
                },
                setBottom: (width:number, color:Color) => {
                this.style.borderBottomWidth = width + 'px';
                this.style.borderBottomColor = color;
                this.style.borderBottomStyle = 'solid';
                return borderConfig;
                }
            };
            
            action.call(borderConfig);
        }
        return this;
    }
    /**
     * 해당 컴포넌트의 부모 추가<br>
     * Add the parent of that component
     * @param parent 부모
     * @return 자기자신
     */
    setParent(parent:IPDFComponent):PDFComponent{
        this.parent = parent;
        return this;
    }
    setStyleAttribute(name:string, value:any){
        this.style[name]=value;
    }

    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            name: 'PDFComponent',
            methods: [
                { name: 'draw', returnType: 'void', params:[] },
                { name: 'wrapGridCell', returnType: 'PDFGridCell', params:[] },
                { name: 'wrapGridCell', returnType: 'PDFGridCell', params:['int', 'int'] },
                { name: 'setSize', returnType: 'PDFComponent', params:['Number', 'Number'] },
                { name: 'setBackgroundColor', returnType: 'PDFComponent', params: ['int'] },
                { name: 'setMargin', returnType: 'PDFComponent', params: ['float'] },
                { name: 'setMargin', returnType: 'PDFComponent', params: ['float', 'float'] },
                { name: 'setMargin', returnType: 'PDFComponent', params: ['float', 'float','float', 'float'] },
                { name: 'setPadding', returnType: 'PDFComponent', params: ['float'] },
                { name: 'setPadding', returnType: 'PDFComponent', params: ['float', 'float'] },
                { name: 'setPadding', returnType: 'PDFComponent', params: ['float', 'float','float', 'float'] },
                { name: 'setBorder', returnType: 'PDFComponent', params: ['Action'] },
                { name: 'setBorder', returnType: 'PDFComponent', params: ['float', 'int'] },
                { name: 'setParent', returnType: 'PDFComponent', params: ['PDFComponent'] },
            ],
            variableDeclaration: /PDFComponent\s+(\w+)\s*=/g,
            methodChain: /(\w+)\.(wrapGridCell|setSize|setBackgroundColor|setMargin|setPadding|setBorder|setParent)\(.*\)/g
        }
    }
}