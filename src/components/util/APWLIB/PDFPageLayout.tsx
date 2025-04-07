import { LibraryProps, Paper } from "./enum.tsx";

export class RectF{
    left:number;
    top:number;
    right:number;
    bottom:number;
    constructor();
    constructor(left:number, top:number, right:number, bottom:number);
    constructor(left?:number, top?:number, right?:number, bottom?:number){
        this.left = left ?? 0;
        this.top = top ?? 0;
        this.right = right ?? 0;
        this.bottom = bottom ?? 0;
    }
    width():number{
        return this.right - this.left;
    }
    height():number{
        return this.bottom - this.top;
    }
    
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            object: RectF,
            name: 'RectF',
            constructors: [
                { params:[] },
                { params:['float','float','float','float'] }
            ],
            methods: [
                { name: 'width', returnType: 'float', params:[] },
                { name: 'height', returnType: 'float', params:[] },
            ],
            variableDeclaration: /RectF\s+(\w+)\s*=/g,
        }
    }
}

export interface PageLayout {
    getPageRect():RectF;
    getPadding():RectF;
    getContentWidth():number;
    getContentHeight():number;
}

export class PDFPageLayout implements PageLayout{
    readonly pageRect:RectF;
    readonly padding:RectF;
    constructor(pageRect:RectF,padding:RectF){
        this.pageRect = pageRect;
        this.padding = padding;
    }
    getPageRect():RectF{
        return this.pageRect;
    };
    getPadding():RectF{
        return this.padding;
    }
    getContentWidth():number{
        return this.pageRect.width() - this.padding.left - this.padding.right;
    }
    getContentHeight():number{
        return this.pageRect.height() - this.padding.top - this.padding.bottom;
    }
    
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            object: PDFPageLayout,
            name: 'PDFPageLayout',
            extend: 'PageLayout',
            constructors: [
                { params:['RectF','RectF'] },
            ],
            methods: [
                { name: 'getPageRect', returnType: 'RectF', params:[] },
                { name: 'getPadding', returnType: 'RectF', params:[] },
                { name: 'getContentWidth', returnType: 'float', params:[] },
                { name: 'getContentHeight', returnType: 'float', params:[] },
            ],
            variableDeclaration: /PDFPageLayout\s+(\w+)\s*=/g,
        }
    }
}

export class PageLayoutFactory{
    static createDefaultLayout():PageLayout{
        const pagesize:Paper = Paper.A4;
        return new PDFPageLayout(new RectF(0, 0, pagesize.getWidth(), pagesize.getHeight()), new RectF())
    }
    static createLayout(pageSize:Paper, padding:RectF):PageLayout;
    static createLayout(pageSize:Paper, vertical:number, horizontal:number):PageLayout;
    static createLayout(pageSize:Paper, left:number|null, top:number|null, right:number|null, bottom:number|null):PageLayout;
    static createLayout(pageSize:Paper, left:RectF|number|null, top?:number|null, right?:number|null, bottom?:number|null):PageLayout{
        if(typeof left === 'number'||left===null){
            if(top||top===null){
                if(left !==null && top !== null){
                    let vertical = left;
                    let horizontal = top;
                    if(vertical < 0)vertical = 0;
                    if(horizontal < 0)horizontal = 0;
                    const padding:RectF = new RectF(vertical, horizontal, vertical, horizontal);
                    return PageLayoutFactory.createLayout(pageSize, padding);
                }else if((right||right===null)&&(bottom||bottom===null)){
                    let n_left = 0;
                    let n_top = 0;
                    let n_right = 0;
                    let n_bottom = 0;
                    if(left != null && left > 0)n_left = left;
                    if(top != null && top > 0)n_top=top;
                    if(right != null && right > 0)n_right=right;
                    if(bottom != null && bottom > 0)n_bottom=bottom;
                    const padding:RectF = new RectF(n_left, n_top, n_right, n_bottom);
                    return PageLayoutFactory.createLayout(pageSize, padding);
                }
            }
        }
        let padding:RectF = new RectF();
        if(left !== null && typeof left !== 'number'){
            padding = left;
        }
        const pageRect:RectF = new RectF(0, 0, pageSize.getWidth(), pageSize.getHeight());
        return new PDFPageLayout(pageRect, padding);
    }
    
    static toLibrary():LibraryProps{
        return {
            type: 'Class',
            object: PageLayoutFactory,
            name: 'PageLayoutFactory',
            methods: [
                { name: 'createDefaultLayout',  isStatic:true, returnType: 'PageLayout', params:[] },
                { name: 'createLayout',         isStatic:true, returnType: 'PageLayout', params:['Paper','RectF'] },
                { name: 'createLayout',         isStatic:true, returnType: 'PageLayout', params:['Paper','float','float'] },
                { name: 'createLayout',         isStatic:true, returnType: 'PageLayout', params:['Paper','float','float','float','float'] },
            ],
        }
    }
}