import { LibraryProps } from "./enum.tsx";
import { PDFLayout } from "./PDFLayout.tsx";
import { PageLayout, PageLayoutFactory, RectF } from "./PDFPageLayout.tsx";

export class PDFBuilder {
    readonly pageLayout:PageLayout;
    result:string; // JAVA 와 다른 부분
    constructor();
    constructor(pageLayout:PageLayout);
    constructor(pageLayout?:PageLayout){
        this.pageLayout = pageLayout?pageLayout:PageLayoutFactory.createDefaultLayout();
    }
    draw(root?:PDFLayout):PDFBuilder{
        if(root){
            const width:number = this.pageLayout.getContentWidth();
            const height:number = this.pageLayout.getContentHeight();

            root.setSize(width, null);
            const padding:RectF = this.pageLayout.getPadding();
            this.result = `<div id="printSection" style="width:${(width)}px; height:${(height)}px; box-sizing: border-box; background-color:white;
            padding:${padding.left}px ${padding.top}px ${padding.right}px ${padding.bottom}px;" class="pdf-page"> ${root.draw()}</div>`;
        }
        return this;
    }
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            object: PDFBuilder,
            name: 'PDFBuilder',
            constructors: [
                { params:[] },
                { params:['PageLayout'] }
            ],
            methods: [
                { name: 'draw', returnType: 'PDFBuilder', params:['PDFLayout'] },
            ],
        }
    }
}