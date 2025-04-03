import { Color, LibraryProps } from "./enum";
import { IPDFComponent, PDFComponent } from "./PDFComponent";
import { PDFLayout } from "./PDFLayout";

export class PDFGridCell extends PDFLayout {
    children:IPDFComponent;
    row:number;
    col:number;
    rowSpan:number;
    colSpan:number;
    constructor(content:IPDFComponent);
    constructor(content:IPDFComponent,rowSpan:number,columnSpan:number);
    constructor(content:IPDFComponent,rowSpan?:number,columnSpan?:number){
        super();
        if(!!rowSpan&&!!columnSpan){
            if(rowSpan > 1) this.rowSpan = rowSpan;
            if(columnSpan > 1) this.colSpan = columnSpan;
        }else {
            this.rowSpan = 1;
            this.colSpan = 1;
        }
        this.setChild(content);
    }
    draw() {
        this.style.gridColumn = `${this.col}/${this.col+this.colSpan}`;
        this.style.gridRow = `${this.row}/${this.col+this.rowSpan}`;
        return `<div style="${this.styleToString()}" class="pdf-grid-cell">
            ${this.children ? this.children.draw() : ''}
        </div>`;
    }
    /**
     * 셀의 위치 강제 조정<br>
     * Force Cell's Position Adjustment
     * @param position 셀의 위치
     */
    setPosition(row:number, col:number){
        this.row = row;
        this.col = col;
    }
    setChild(content:IPDFComponent):PDFGridCell{
        content.setParent(this);
        this.children = content;
        return this;
    }
    setColumnSpan(columnSpan:number):PDFGridCell{
        this.colSpan = columnSpan;
        return this;
    }
    setRowSpan(rowSpan:number):PDFGridCell{
        this.rowSpan = rowSpan;
        return this;
    }
    /**
     * 셀의 크기는 무조건 격자 구획에서 셀의 위치와 범위에 의해서 정해진다.
     * @param width 가로 크기
     * @param height 세로 크기
     * @return
     */
    setSize(width:number|null, height:number|null):PDFGridCell {
        super.setSize(width, height);
        if(this.children != null){
            this.children.setSize(width, height);
        }
        return this;
    }
    /**
     * 컴포넌트 내의 배경의 색상 설정<br>
     * Set the color of the background within the component
     * @param color 색상
     * @return 컴포넌트 자기자신
     */
    setBackgroundColor(color:Color):PDFGridCell{
        this.style.backgroundColor = color;
        return this;
    }
    /**
     * 셀은 자체적으로 Margin을 가질 수 없다.<br>
     * Cells cannot have Margin on their own.
     */
    setMargin(all:number):PDFGridCell;
    /**
     * 셀은 자체적으로 Margin을 가질 수 없다.<br>
     * Cells cannot have Margin on their own.
     */
    setMargin(horizontal:number, vertical:number):PDFGridCell;
    /**
     * 셀은 자체적으로 Margin을 가질 수 없다.<br>
     * Cells cannot have Margin on their own.
     */
    setMargin(left:number, top:number, right:number, bottom:number):PDFGridCell;
    setMargin(left:number, top?:number, right?:number, bottom?:number):PDFGridCell{
        return this;
    }
    /**
     * 셀은 자체적으로 Padding 을 가질 수 없다.<br>
     * Cells cannot have Padding on their own.
     */
    setPadding(all:number):PDFGridCell;
    /**
     * 셀은 자체적으로 Padding 을 가질 수 없다.<br>
     * Cells cannot have Padding on their own.
     */
    setPadding(horizontal:number, vertical:number):PDFGridCell;
    /**
     * 셀은 자체적으로 Padding 을 가질 수 없다.<br>
     * Cells cannot have Padding on their own.
     */
    setPadding(left:number, top:number, right:number, bottom:number):PDFGridCell;
    setPadding(left:number, top?:number, right?:number, bottom?:number):PDFGridCell{
        return this;
    }
    /**
     * 셀은 자체적으로 Border을 가질 수 없다.<br>
     * Cells cannot have Border on their own.
     */
    setBorder(action:Function):PDFGridCell;
    /**
     * 셀은 자체적으로 Border을 가질 수 없다.<br>
     * Cells cannot have Border on their own.
     */
    setBorder(size:number, color:Color):PDFGridCell;
    setBorder(size:number|Function, color?:Color):PDFGridCell{
        return this;
    }
    /**
     * 격자 구획 에서 셀이 추가 되었을 때 위치를 가져 옵니다.
     * 격자 구획 으로 부터 셀의 위치<br>
     * columns 이 3인 Horizontal 격자 구획 에서 position 이 4라면
     * <p>row = Math.floor(4/3), column = 4 - 3 * row</p>
     * Cell's location from GridLayout<br>
     * If position is 4 in Horizontal GridLayout where columns is 3
     * <p>row = Math.floor(4/3), column = 4 - 3 * row</p>
     * @param parent 부모 컴포넌트
     * @return 자기자신
     */
    setParent(parent:IPDFComponent):PDFGridCell{
        this.parent = parent;
        return this;
    }

    static build(content:IPDFComponent):PDFGridCell;
    static build(content:IPDFComponent, rowSpan:number, colSpane:number):PDFGridCell;
    static build(content:IPDFComponent, rowSpan?:number, colSpan?:number){
        if(!!rowSpan&&!!colSpan){
            return new PDFGridCell(content, rowSpan, colSpan);
        } else {
            return new PDFGridCell(content);
        }
    }
        
    static toLibrary():LibraryProps{
        return {
            name: 'PDFGridCell',
            methods: [
                { name: 'draw', returnType: 'void', params:[] },
                { name: 'setSize', returnType: 'PDFGridCell', params:['Number', 'Number'] },
                { name: 'setBackgroundColor', returnType: 'PDFGridCell', params: ['int'] },
                { name: 'setChild', returnType: 'PDFGridCell', params:['PDFComponent'] },
                { name: 'setColumnSpan', returnType: 'PDFGridCell', params:['int'] },
                { name: 'setRowSpan', returnType: 'PDFGridCell', params:['int'] },
                { name: 'setMargin', returnType: 'PDFGridCell', params: ['float'] },
                { name: 'setMargin', returnType: 'PDFGridCell', params: ['float', 'float'] },
                { name: 'setMargin', returnType: 'PDFGridCell', params: ['float', 'float','float', 'float'] },
                { name: 'setPadding', returnType: 'PDFGridCell', params: ['float'] },
                { name: 'setPadding', returnType: 'PDFGridCell', params: ['float', 'float'] },
                { name: 'setPadding', returnType: 'PDFGridCell', params: ['float', 'float','float', 'float'] },
                { name: 'setBorder', returnType: 'PDFGridCell', params: ['Action'] },
                { name: 'setBorder', returnType: 'PDFGridCell', params: ['float', 'int'] },
                { name: 'setParent', returnType: 'PDFGridCell', params: ['PDFComponent '] },
                { name: 'build', isStatic:true, returnType: 'PDFGridCell', params: ['PDFComponent'] },
                { name: 'build', isStatic:true, returnType: 'PDFGridCell', params: ['PDFComponent','int','int'] },
            ],
            variableDeclaration: /PDFGridCell\s+(\w+)\s*=/g,
            staticMethods: /PDFGridCell\.(build)/g,
            methodChain: /(\w+)\.(setSize|setBackgroundColor|setChild|setColumnSpan|setRowSpan|setMargin|setPadding|setBorder|setParent)/g
        }
    }
}