import { LibraryProps } from "./enum";
import { PDFLayout } from "./PDFLayout.tsx";
import { PageLayout, PageLayoutFactory } from "./PDFPageLayout.tsx";

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
            let width:number = this.pageLayout.getContentWidth();

            root.setSize(width, null);
            this.result = root.draw();
        }
        return this;
    }
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
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