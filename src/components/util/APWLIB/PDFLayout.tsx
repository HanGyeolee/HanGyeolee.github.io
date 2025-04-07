import { Color, LibraryProps, Orientation } from "./enum.tsx";
import { PDFComponent } from "./PDFComponent.tsx";
import { PDFGridCell } from "./PDFGridCell.tsx";

export class PDFLayout extends PDFComponent {
    fitChildrenToLayout:boolean;
    constructor() {
        super();
        this.fitChildrenToLayout = false;
    }
    /**
     * 레이아웃의 모든 하위 구성 요소를 부모 크기에 맞출지 설정
     */
    setFitChildrenToLayout(fit:boolean):PDFLayout {
        this.fitChildrenToLayout = fit;
        return this;
    }
}

export class PDFLinearLayout extends PDFLayout {
    children:PDFComponent[];
    weights:number[];
    constructor(){
        super();
        this.children = [];
        this.weights = [];
        this.style = {
          display: 'flex',
          boxSizing: 'border-box'
        };
    }
    draw(){
        this.children.map((child, idx) => child.setStyleAttribute("flex", this.weights[idx]));
        return `<div style="${this.styleToString()}" class="pdf-linear-layout">
          ${this.children.map(child => child.draw()).join('')}
        </div>`;
    }

    /**
     * 레이아웃에 자식 추가<br>
     * Add children to layout
     * @param component 하위 구성 요소
     * @return 자기자신
     */
    addChild(component:PDFComponent):PDFLinearLayout;
    /**
     * 레이아웃에 자식 추가<br>
     * Add children to layout<br>
     * @param component 하위 구성 요소
     * @param weight 하위 구성 요소가 차지할 크기 비율. 반드시 1.0f보다 커야한다.<br/>
     *               만약 {@link orientation} 이 {@link Orientation.Horizontal} 라면 width, {@link Orientation.Vertical} 이라면 height 를 넣으면 된다.<br/>
     *               Ratio of the size of the child component. Must bigger than 1.0f<br/>
     *               If {@link orientation} is {@link Orientation.Horizontal} then width, {@link Orientation.Vertical} then height.
     * @return 자기자신
     */
    addChild(component:PDFComponent, weight:number):PDFLinearLayout;
    addChild(component:PDFComponent, weight?:number):PDFLinearLayout{
        if(!weight){ weight = 1; }
        if(weight < 1) weight = 1;
        if(this.children.length == this.weights.length)
            this.weights.push(weight);
        component.setParent(this);
        this.children.push(component);
        return this;
    }
    /**
     * 이전에 설정한 가중치 값들을 지우고, 지정한 가중치로 변경합니다.<br>
     * 하위 구성 요소의 개수보다 많은 가중치는 무시됩니다. 하위 구성 요소의 개수 보다 적은 가중치를 입력하면 나머지를 1.0f으로 변경합니다.<br>
     * Clear the previously set weights values and change them to the specified weights.<br>
     * Weights greater than the number of child components are ignored. If you enter weights less than the child component, change the rest to 1.0f.<br>
     * @param weights 가중치
     * @return
     */
    setWeights(weights:number[]):PDFLinearLayout{
        this.weights = [];
        for(let weight of weights){
            this.weights.push(weight);
        }
        while(this.children.length > this.weights.length){
            this.weights.push(1.0);
        }
        return this;
    }
    /**
     * 레이아웃의 방향 설정<br>
     * Setting the orientation of the layout
     * @param orientation 방향
     * @return 자기자신
     */
    setOrientation(orientation:Orientation):PDFLinearLayout{
        this.style.flexDirection = orientation === Orientation.Vertical ? 'column' : 'row';
        return this;
    }
    /**
     * 컴포넌트 내의 내용(content)의 크기 설정 <br>
     * Setting the size of content within a component
     * @param width 가로 크기
     * @param height 세로 크기
     * @return 컴포넌트 자기자신
     */
    setSize(width:number|null, height:number|null):PDFLinearLayout {
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
    setBackgroundColor(color:Color):PDFLinearLayout{
        this.style.backgroundColor = color;
        return this;
    }
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param all 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(all:number):PDFLinearLayout;
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param horizontal 가로 여백
     * @param vertical 세로 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(horizontal:number, vertical:number):PDFLinearLayout;
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param left 왼쪽 여백
     * @param top 위쪽 여백
     * @param right 오른쪽 여백
     * @param bottom 아래쪽 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(left:number, top:number, right:number, bottom:number):PDFLinearLayout;
    setMargin(left:number, top?:number, right?:number, bottom?:number):PDFLinearLayout{
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
    setPadding(all:number):PDFLinearLayout;
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param horizontal 가로 패딩
     * @param vertical 세로 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(horizontal:number, vertical:number):PDFLinearLayout;
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param left 왼쪽 패딩
     * @param top 위쪽 패딩
     * @param right 오른쪽 패딩
     * @param bottom 아래쪽 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(left:number, top:number, right:number, bottom:number):PDFLinearLayout;
    setPadding(left:number, top?:number, right?:number, bottom?:number):PDFLinearLayout{
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
    setBorder(action:Function):PDFLinearLayout;
    /**
     * 테두리 굵기 및 색상 지정<br>
     * Specify border thickness and color
     * @param size 전체 테두리 굵기
     * @param color 전체 테두리 색상
     */
    setBorder(size:number, color:Color):PDFLinearLayout;
    setBorder(size:number|Function, color?:Color):PDFLinearLayout{
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
            return this;
        }
        return this;
    }
    /**
     * 해당 컴포넌트의 부모 추가<br>
     * Add the parent of that component
     * @param parent 부모
     * @return 자기자신
     */
    setParent(parent:PDFComponent):PDFLinearLayout{
        this.parent = parent;
        return this;
    }

    static build(orientation:Orientation):PDFLinearLayout{
        return new PDFLinearLayout().setOrientation(orientation);
    }
    
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            object: PDFLinearLayout,
            name: 'PDFLinearLayout',
            extend: 'PDFComponent',
            constructors: [
                { params:[] },
            ],
            methods: [
                { name: 'draw', returnType: 'void', params:[] },
                { name: 'wrapGridCell', returnType: 'PDFGridCell', params:[] },
                { name: 'wrapGridCell', returnType: 'PDFGridCell', params:['int', 'int'] },
                { name: 'addChild', returnType: 'PDFLinearLayout', params:['PDFComponent'] },
                { name: 'addChild', returnType: 'PDFLinearLayout', params:['PDFComponent','float'] },
                { name: 'setWeights', returnType: 'PDFLinearLayout', params:['float...'] },
                { name: 'setOrientation', returnType: 'PDFLinearLayout', params:['Orientation'] },
                { name: 'setSize', returnType: 'PDFLinearLayout', params:['Number', 'Number'] },
                { name: 'setBackgroundColor', returnType: 'PDFLinearLayout', params: ['int'] },
                { name: 'setMargin', returnType: 'PDFLinearLayout', params: ['float'] },
                { name: 'setMargin', returnType: 'PDFLinearLayout', params: ['float', 'float'] },
                { name: 'setMargin', returnType: 'PDFLinearLayout', params: ['float', 'float','float', 'float'] },
                { name: 'setPadding', returnType: 'PDFLinearLayout', params: ['float'] },
                { name: 'setPadding', returnType: 'PDFLinearLayout', params: ['float', 'float'] },
                { name: 'setPadding', returnType: 'PDFLinearLayout', params: ['float', 'float','float', 'float'] },
                { name: 'setBorder', returnType: 'PDFLinearLayout', params: ['Action'] },
                { name: 'setBorder', returnType: 'PDFLinearLayout', params: ['float', 'int'] },
                { name: 'setParent', returnType: 'PDFLinearLayout', params: ['PDFComponent'] },
                { name: 'build', isStatic:true, returnType: 'PDFLinearLayout', params: ['Orientation'] },
            ],
            variableDeclaration: /PDFLinearLayout\s+(\w+)\s*=/g,
            staticMethods: /PDFLinearLayout\.(build)/g,
            methodChain: /(\w+)\.(wrapGridCell|addChild|setWeights|setOrientation|setSize|setBackgroundColor|setMargin|setPadding|setBorder|setParent)\(.*\)/g
        }
    }
}

export class PDFGridLayout extends PDFLayout {
    cells:PDFGridCell[];
    count:number;
    constructor(count:number){
        super();
        this.cells = [];
        this.count = count;
        this.style = {
            display: 'grid',
            boxSizing: 'border-box'
        };
    }
    draw(){
        return `<div style="${this.styleToString()}" class="pdf-linear-layout">
          ${this.cells.map(child => child.draw()).join('')}
        </div>`;
    }
    /**
     * 레이아웃에 자식 추가<br>
     * Add children to layout<br>
     * @param cell 하위 셀 요소
     * @return 자기자신
     */
    addCell(cell:PDFGridCell):PDFGridLayout;
    /**
     * 구획에 자식 추가<br>특정 행과 열에 강제적으로 자식 구성 요소를 배치합니다.<br>
     * 셀의 범위에 의해서 다른 구성 요소와 겹쳐질 수 있습니다.<br>
     * Add children to layout<br>Forced to place child components in specific rows and columns.<br>
     * They can be overlaid with other components by the Span in the cell.<br>
     * @param cell 하위 셀 요소
     * @param row 격자 요소에서의 행
     * @param column 격자 요소에서의 열
     * @return 자기자신
     */
    addCell(row:number, column:number, cell:PDFGridCell):PDFGridLayout;
    addCell(row:number|PDFGridCell, column?:number, cell?:PDFGridCell):PDFGridLayout{
        if(typeof row !== 'number'){
            let cell:PDFGridCell = row;
            this.cells.push(cell);
        } else if(column&&cell) {
            cell.setPosition(row, column);
            this.cells.push(cell);
        }
        return this;
    }
    /**
     * 컴포넌트 내의 내용(content)의 크기 설정 <br>
     * Setting the size of content within a component
     * @param width 가로 크기
     * @param height 세로 크기
     * @return 컴포넌트 자기자신
     */
    setSize(width:number|null, height:number|null):PDFGridLayout {
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
    setBackgroundColor(color:Color):PDFGridLayout{
        this.style.backgroundColor = color;
        return this;
    }
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param all 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(all:number):PDFGridLayout;
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param horizontal 가로 여백
     * @param vertical 세로 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(horizontal:number, vertical:number):PDFGridLayout;
    /**
     * 컴포넌트 밖의 여백 설정<br>
     * Setting margins outside of components
     * @param left 왼쪽 여백
     * @param top 위쪽 여백
     * @param right 오른쪽 여백
     * @param bottom 아래쪽 여백
     * @return 컴포넌트 자기자신
     */
    setMargin(left:number, top:number, right:number, bottom:number):PDFGridLayout;
    setMargin(left:number, top?:number, right?:number, bottom?:number):PDFGridLayout{
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
    setPadding(all:number):PDFGridLayout;
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param horizontal 가로 패딩
     * @param vertical 세로 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(horizontal:number, vertical:number):PDFGridLayout;
    /**
     * 컴포넌트 내의 내용(content)과 테두리(border) 사이의 간격 설정<br>
     * Setting the interval between content and border within a component
     * @param left 왼쪽 패딩
     * @param top 위쪽 패딩
     * @param right 오른쪽 패딩
     * @param bottom 아래쪽 패딩
     * @return 컴포넌트 자기자신
     */
    setPadding(left:number, top:number, right:number, bottom:number):PDFGridLayout;
    setPadding(left:number, top?:number, right?:number, bottom?:number):PDFGridLayout{
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
    setBorder(action:Function):PDFGridLayout;
    /**
     * 테두리 굵기 및 색상 지정<br>
     * Specify border thickness and color
     * @param size 전체 테두리 굵기
     * @param color 전체 테두리 색상
     */
    setBorder(size:number, color:Color):PDFGridLayout;
    setBorder(size:number|Function, color?:Color):PDFGridLayout{
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
            return this;
        }
        return this;
    }
    /**
     * 해당 컴포넌트의 부모 추가<br>
     * Add the parent of that component
     * @param parent 부모
     * @return 자기자신
     */
    setParent(parent:PDFComponent):PDFGridLayout{
        this.parent = parent;
        return this;
    }
    /**
     * 레이아웃의 방향 설정<br>
     * Setting the orientation of the layout
     * @return 자기자신
     */
    setHorizontal():PDFGridLayout{
        this.style.gridAutoFlow = "row";
        this.style.gridTemplateColumns = `repeat(${this.count}, 1fr);`
        this.style.gridTemplateRows = '';
        return this;
    }
    setVertical(height:number):PDFGridLayout{
        if(height > 0) {
            this.style.height = height;
            this.style.gridAutoFlow = "column";
            this.style.gridTemplateColumns = '';
            this.style.gridTemplateRows = `repeat(${this.count}, 1fr);`;
        }
        return this;
    }
    static horizontal(columnCount:number):PDFGridLayout{
        return new PDFGridLayout(columnCount).setHorizontal();
    }
    static vertical(rowCount:number, height:number):PDFGridLayout {
        return new PDFGridLayout(rowCount).setVertical(height);
    }
    
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            object: PDFGridLayout,
            name: 'PDFGridLayout',
            extend: 'PDFComponent',
            constructors: [
                { params:['int'] },
            ],
            methods: [
                { name: 'draw', returnType: 'void', params:[] },
                { name: 'wrapGridCell', returnType: 'PDFGridCell', params:[] },
                { name: 'wrapGridCell', returnType: 'PDFGridCell', params:['int', 'int'] },
                { name: 'addCell', returnType: 'PDFGridLayout', params:['PDFGridCell'] },
                { name: 'addCell', returnType: 'PDFGridLayout', params:['int','int','PDFGridCell'] },
                { name: 'setHorizontal', returnType: 'PDFGridLayout', params:[] },
                { name: 'setVertical', returnType: 'PDFGridLayout', params:['float'] },
                { name: 'setSize', returnType: 'PDFGridLayout', params:['Number', 'Number'] },
                { name: 'setBackgroundColor', returnType: 'PDFGridLayout', params: ['int'] },
                { name: 'setMargin', returnType: 'PDFGridLayout', params: ['float'] },
                { name: 'setMargin', returnType: 'PDFGridLayout', params: ['float', 'float'] },
                { name: 'setMargin', returnType: 'PDFGridLayout', params: ['float', 'float','float', 'float'] },
                { name: 'setPadding', returnType: 'PDFGridLayout', params: ['float'] },
                { name: 'setPadding', returnType: 'PDFGridLayout', params: ['float', 'float'] },
                { name: 'setPadding', returnType: 'PDFGridLayout', params: ['float', 'float','float', 'float'] },
                { name: 'setBorder', returnType: 'PDFGridLayout', params: ['Action'] },
                { name: 'setBorder', returnType: 'PDFGridLayout', params: ['float', 'int'] },
                { name: 'setParent', returnType: 'PDFGridLayout', params: ['PDFComponent'] },
                { name: 'horizontal', isStatic:true, returnType: 'PDFGridLayout', params: ['int'] },
                { name: 'vertical', isStatic:true, returnType: 'PDFGridLayout', params: ['int','float'] },
            ],
            variableDeclaration: /PDFGridLayout\s+(\w+)\s*=/g,
            staticMethods: /PDFGridLayout\.(horizontal|vertical)/g,
            methodChain: /(\w+)\.(wrapGridCell|addCell|setHorizontal|setVertical|setSize|setBackgroundColor|setMargin|setPadding|setBorder|setParent)\(.*\)/g
        }
    }
}