export interface FileObject{
  name: string,
  url: string,
  type: string,
  id?:string
}

export interface Files{
  file: FileObject[],
  assets: FileObject[],
  resource: FileObject[]
}

export interface RawFiles{
  file: File[],
  assets: File[],
  resource: File[]
}

export type FileWrapper = 'file' | 'assets' | 'resource';

export interface LibraryProps{
  type: 'Class'|'Enum',
  object: any;
  name: string;
  extend?: string;
  constructors?: {
    params: string[];
    document?: string;
  }[],
  variables?: {
    name: string;
    type: string;
    isStatic?:boolean;
    document?: string;
  }[];
  methods?: {
    name: string;
    returnType: string;
    params: string[];
    isStatic?:boolean;
    document?: string;
  }[];
  variableDeclaration?: RegExp,
  staticMethods?: RegExp,
  methodChain?: RegExp
}

export enum Color {
  TRANSPARENT='transparent',
  BLACK= 'black',
  WHITE= 'white',
  RED= 'red',
  GREEN= 'green',
  BLUE= 'blue',
  YELLOW= 'yellow',
  MAGENTA= 'magenta',
  GRAY= 'gray',
};

export const PDFColorLibrary:LibraryProps = {
  type:'Enum',
  object: Color,
  name:'Color',
  variables: [
    { name:'TRANSPARENT',   isStatic:true, type:'int' },
    { name:'BLACK',         isStatic:true, type:'int' },
    { name:'WHITE',         isStatic:true, type:'int' },
    { name:'RED',           isStatic:true, type:'int' },
    { name:'GREEN',         isStatic:true, type:'int' },
    { name:'BLUE',          isStatic:true, type:'int' },
    { name:'YELLOW',        isStatic:true, type:'int' },
    { name:'MAGENTA',       isStatic:true, type:'int' },
    { name:'GRAY',          isStatic:true, type:'int' },
  ],
  variableDeclaration: /Color\s+(\w+)\s*=/g,
};

export enum PDFFont {
  HELVETICA     ='Helvetica, Arial, sans-serif',
  HELVETICA_BOLD='Helvetica-Bold, Arial, sans-serif',
  TIMES_ROMAN   ='Times New Roman, serif',
  TIMES_BOLD    ='Times-Bold, Times New Roman, serif',
  COURIER       ='Courier, monospace',
  COURIER_BOLD  ='Courier-Bold, Courier, monospace'
};
export const PDFFontLibrary:LibraryProps = {
  type:'Enum',
  object: PDFFont,
  name:'PDFFont',
  variables: [
    { name:'HELVETICA',         isStatic:true, type:'PDFFont' },
    { name:'HELVETICA_BOLD',    isStatic:true, type:'PDFFont' },
    { name:'TIMES_ROMAN',       isStatic:true, type:'PDFFont' },
    { name:'TIMES_BOLD',        isStatic:true, type:'PDFFont' },
    { name:'COURIER',           isStatic:true, type:'PDFFont' },
    { name:'COURIER_BOLD',      isStatic:true, type:'PDFFont' },
  ],
  variableDeclaration: /PDFFont\s+(\w+)\s*=/g,
};

export enum TextAlign {
  Start='start',
  End='end',
  Left='left',
  Right='right',
  Center='center',
  Justify='justify'
};
export const PDFTextAlignLibrary:LibraryProps = {
  type:'Enum',
  object: TextAlign,
  name:'TextAlign',
  variables: [
    { name:'Start',     isStatic:true, type:'int' },
    { name:'End',       isStatic:true, type:'int' },
    { name:'Left',      isStatic:true, type:'int' },
    { name:'Right',     isStatic:true, type:'int' },
    { name:'Center',    isStatic:true, type:'int' },
    { name:'Justify',   isStatic:true, type:'int' },
  ],
  variableDeclaration: /TextAlign\s+(\w+)\s*=/g,
};

export enum Fit {
  NONE='none',
  FILL='fill',
  CONTAIN='contain',
  COVER='cover'
};
export const PDFFitLibrary:LibraryProps = {
  type:'Enum',
  object: Fit,
  name:'Fit',
  variables: [
    { name:'FILL',        isStatic:true, type:'int', document:'요소 콘텐츠 박스 크기에 맞춰 대체 콘텐츠의 크기를 조절합니다.\n\n콘텐츠가 콘텐츠 박스를 가득 채웁니다. 서로의 가로세로비가 일치하지 않으면 콘텐츠가 늘어납니다.' },
    { name:'CONTAIN',     isStatic:true, type:'int', document:'대체 콘텐츠의 가로세로비를 유지하면서, 요소의 콘텐츠 박스 내부에 들어가도록 크기를 맞춤 조절합니다.\n\n콘텐츠가 콘텐츠 박스 크기에 맞도록 하면서도 가로세로비를 유지하게 되므로, 서로의 가로세로비가 일치하지 않으면 객체가 "레터박스"처럼 됩니다.' },
    { name:'COVER',       isStatic:true, type:'int', document:'대체 콘텐츠의 가로세로비를 유지하면서, 요소 콘텐츠 박스를 가득 채웁니다.\n\n서로의 가로세로비가 일치하지 않으면 객체 일부가 잘려나갑니다.' },
    { name:'NONE',        isStatic:true, type:'int', document:'대체 콘텐츠의 크기를 조절하지 않습니다.' },
    { name:'SCALE_DOWN',  isStatic:true, type:'int', document:'대체 콘텐츠의 크기가 더 작아지는 값을 선택합니다.' },
  ],
  variableDeclaration: /Fit\s+(\w+)\s*=/g,
};

export enum Orientation {
  Vertical='vertical',
  Horizontal='horizontal'
};
export const PDFOrientationLibrary:LibraryProps = {
  type:'Enum',
  object: Orientation,
  name:'Orientation',
  variables: [
    { name:'Vertical',    isStatic:true, type:'int', document:'가로' },
    { name:'Horizontal',  isStatic:true, type:'int', document:'세로' },
  ],
  variableDeclaration: /Orientation\s+(\w+)\s*=/g,
};

export class PaperUnit {
  static readonly MM = new PaperUnit("MM");
  static readonly INCH = new PaperUnit("INCH");
  private static currentDPI: number = 72.0; // 기본값 설정

  private name: "MM"|"INCH";
  private constructor(name:"MM"|"INCH"){
    this.name = name;
  }
  static setDPI(dpi: number): void {
    PaperUnit.currentDPI = dpi;
  }
  toPt(): number {
    switch (this.name) {
        case "MM":
            return PaperUnit.currentDPI / 25.4;
        case "INCH":
            return PaperUnit.currentDPI;
    }
    return 1.0;
  }
  static toLibrary():LibraryProps{
    return {
      type:'Enum',
      object: PaperUnit,
      name:'PaperUnit',
      variables: [
        { name:'MM',    isStatic:true, type:'PaperUnit', document:'미리미터' },
        { name:'INCH',  isStatic:true, type:'PaperUnit', document:'인치' },
      ],
      methods: [
        { name:'toPt', returnType:'double', params:[] },
      ],
      variableDeclaration: /PaperUnit\s+(\w+)\s*=/g,
    };
  }
}

export class Paper {
  private static CORRECTION_FACTOR:number = 1.203125;
  static readonly A0 = new Paper(840    +Paper.CORRECTION_FACTOR , 1188, PaperUnit.MM);
  static readonly A1 = new Paper(594    +Paper.CORRECTION_FACTOR , 840, PaperUnit.MM);
  static readonly A2 = new Paper(420    +Paper.CORRECTION_FACTOR , 594, PaperUnit.MM);
  static readonly A3 = new Paper(297    +Paper.CORRECTION_FACTOR , 420, PaperUnit.MM);
  static readonly A4 = new Paper(210    +Paper.CORRECTION_FACTOR , 297, PaperUnit.MM);
  static readonly A5 = new Paper(148.5  +Paper.CORRECTION_FACTOR , 210, PaperUnit.MM);
  static readonly B0 = new Paper(1028   +Paper.CORRECTION_FACTOR , 1456, PaperUnit.MM);
  static readonly B1 = new Paper(728    +Paper.CORRECTION_FACTOR , 1028, PaperUnit.MM);
  static readonly B2 = new Paper(514    +Paper.CORRECTION_FACTOR , 728, PaperUnit.MM);
  static readonly B3 = new Paper(364    +Paper.CORRECTION_FACTOR , 514, PaperUnit.MM);
  static readonly B4 = new Paper(257    +Paper.CORRECTION_FACTOR , 364, PaperUnit.MM);
  static readonly B5 = new Paper(182    +Paper.CORRECTION_FACTOR , 257, PaperUnit.MM);
  static readonly Letter = new Paper(8.5+Paper.CORRECTION_FACTOR , 11, PaperUnit.INCH);
  static readonly Legal = new Paper(8.5 +Paper.CORRECTION_FACTOR , 14, PaperUnit.INCH);

  private width: number;
  private height: number;
  private unit: PaperUnit;

  constructor(width: number, height: number, unit: PaperUnit) {
      this.width = width;
      this.height = height;
      this.unit = unit;
  }

  setCustom(width: number, height: number, unit: PaperUnit): void {
      this.width = width;
      this.height = height;
      this.unit = unit;
  }

  getHeight(): number {
      return this.height * this.unit.toPt();
  }

  getWidth(): number {
      return this.width * this.unit.toPt();
  }

  Landscape(): Paper {
    return new Paper(this.height, this.width, this.unit);
  }

  static toLibrary():LibraryProps{
    return {
      type:'Enum',
      object: Paper,
      name:'Paper',
      variables: [
        { name:'A0',     isStatic:true, type:'Paper' },
        { name:'A1',     isStatic:true, type:'Paper' },
        { name:'A2',     isStatic:true, type:'Paper' },
        { name:'A3',     isStatic:true, type:'Paper' },
        { name:'A4',     isStatic:true, type:'Paper' },
        { name:'A5',     isStatic:true, type:'Paper' },
        { name:'B0',     isStatic:true, type:'Paper' },
        { name:'B1',     isStatic:true, type:'Paper' },
        { name:'B2',     isStatic:true, type:'Paper' },
        { name:'B3',     isStatic:true, type:'Paper' },
        { name:'B4',     isStatic:true, type:'Paper' },
        { name:'B5',     isStatic:true, type:'Paper' },
        { name:'Letter', isStatic:true, type:'Paper' },
        { name:'Legal',  isStatic:true, type:'Paper' },
      ],
      methods: [
        { name:'setCustom', returnType:'void', params:['float', 'float', 'PaperUnit'] },
        { name:'getHeight', returnType:'float', params:[] },
        { name:'getWidth', returnType:'float', params:[] },
        { name:'Landscape', returnType:'Paper', params:[] },
      ],
      variableDeclaration: /PaperUnit\s+(\w+)\s*=/g,
    }
  }
}