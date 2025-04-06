export interface LibraryProps{
  type: 'Class'|'Enum',
  name: string;
  extend?: string;
  constructors?: {
    params: string[];
    document?: string;
  }[],
  variables?: {
    name: string;
    type: string;
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
  name:'Color',
  variables: [
    { name:'TRANSPARENT',  type:'int' },
    { name:'BLACK',  type:'int' },
    { name:'WHITE',  type:'int' },
    { name:'RED',  type:'int' },
    { name:'GREEN',  type:'int' },
    { name:'BLUE',  type:'int' },
    { name:'YELLOW',  type:'int' },
    { name:'MAGENTA',  type:'int' },
    { name:'GRAY',  type:'int' },
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
  name:'PDFFont',
  variables: [
    { name:'Helvetica, Arial, sans-serif',        type:'PDFFont' },
    { name:'Helvetica-Bold, Arial, sans-serif',   type:'PDFFont' },
    { name:'Times New Roman, serif',              type:'PDFFont' },
    { name:'Times-Bold, Times New Roman, serif',  type:'PDFFont' },
    { name:'Courier, monospace',                  type:'PDFFont' },
    { name:'Courier-Bold, Courier, monospace',    type:'PDFFont' },
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

export enum Fit {
  NONE='none',
  FILL='fill',
  CONTAIN='contain',
  COVER='cover'
};

export const PDFFitLibrary:LibraryProps = {
  type:'Enum',
  name:'Fit',
  variables: [
    { name:'FILL',  type:'int', document:'요소 콘텐츠 박스 크기에 맞춰 대체 콘텐츠의 크기를 조절합니다.\n\n콘텐츠가 콘텐츠 박스를 가득 채웁니다. 서로의 가로세로비가 일치하지 않으면 콘텐츠가 늘어납니다.' },
    { name:'CONTAIN',  type:'int', document:'대체 콘텐츠의 가로세로비를 유지하면서, 요소의 콘텐츠 박스 내부에 들어가도록 크기를 맞춤 조절합니다.\n\n콘텐츠가 콘텐츠 박스 크기에 맞도록 하면서도 가로세로비를 유지하게 되므로, 서로의 가로세로비가 일치하지 않으면 객체가 "레터박스"처럼 됩니다.' },
    { name:'COVER',  type:'int', document:'대체 콘텐츠의 가로세로비를 유지하면서, 요소 콘텐츠 박스를 가득 채웁니다.\n\n서로의 가로세로비가 일치하지 않으면 객체 일부가 잘려나갑니다.' },
    { name:'NONE',  type:'int', document:'대체 콘텐츠의 크기를 조절하지 않습니다.' },
    { name:'SCALE_DOWN',  type:'int', document:'대체 콘텐츠의 크기가 더 작아지는 값을 선택합니다.' },
  ],
  variableDeclaration: /Fit\s+(\w+)\s*=/g,
};

export enum Orientation {
  Vertical='vertical',
  Horizontal='horizontal'
};

export const PDFOrientationLibrary:LibraryProps = {
  type:'Enum',
  name:'Orientation',
  variables: [
    { name:'Vertical',  type:'int', document:'가로' },
    { name:'Horizontal',  type:'int', document:'세로' },
  ],
  variableDeclaration: /Orientation\s+(\w+)\s*=/g,
};

export enum PaperUnit {
  MM = "MM",
  INCH = "INCH"
}

export namespace PaperUnit {
  export function toPt(unit: PaperUnit): number {
      switch (unit) {
          case PaperUnit.MM:
              return 72.0 / 25.4;
          case PaperUnit.INCH:
              return 72.0;
      }
      return 1.0;
  }
}

export const PDFPaperUnitLibrary:LibraryProps = {
  type:'Enum',
  name:'PaperUnit',
  variables: [
    { name:'MM',  type:'PaperUnit', document:'미리미터' },
    { name:'INCH',  type:'PaperUnit', document:'인치' },
  ],
  methods: [
    { name:'toPt', returnType:'double', params:[] },
  ],
  variableDeclaration: /PaperUnit\s+(\w+)\s*=/g,
};

export class Paper {
  static readonly A0 = new Paper(840, 1188, PaperUnit.MM);
  static readonly A1 = new Paper(594, 840, PaperUnit.MM);
  static readonly A2 = new Paper(420, 594, PaperUnit.MM);
  static readonly A3 = new Paper(297, 420, PaperUnit.MM);
  static readonly A4 = new Paper(210, 297, PaperUnit.MM);
  static readonly A5 = new Paper(148.5, 210, PaperUnit.MM);
  static readonly B0 = new Paper(1028, 1456, PaperUnit.MM);
  static readonly B1 = new Paper(728, 1028, PaperUnit.MM);
  static readonly B2 = new Paper(514, 728, PaperUnit.MM);
  static readonly B3 = new Paper(364, 514, PaperUnit.MM);
  static readonly B4 = new Paper(257, 364, PaperUnit.MM);
  static readonly B5 = new Paper(182, 257, PaperUnit.MM);
  static readonly Letter = new Paper(8.5, 11, PaperUnit.INCH);
  static readonly Legal = new Paper(8.5, 14, PaperUnit.INCH);

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
      return this.height * PaperUnit.toPt(this.unit);
  }

  getWidth(): number {
      return this.width * PaperUnit.toPt(this.unit);
  }

  Landscape(): Paper {
      const w = this.getWidth();
      this.width = this.getHeight();
      this.height = w;
      return this;
  }
}
export const PDFPaperLibrary:LibraryProps = {
  type:'Enum',
  name:'Paper',
  variables: [
    { name:'A0',     type:'Paper' },
    { name:'A1',     type:'Paper' },
    { name:'A2',     type:'Paper' },
    { name:'A3',     type:'Paper' },
    { name:'A4',     type:'Paper' },
    { name:'A5',     type:'Paper' },
    { name:'B0',     type:'Paper' },
    { name:'B1',     type:'Paper' },
    { name:'B2',     type:'Paper' },
    { name:'B3',     type:'Paper' },
    { name:'B4',     type:'Paper' },
    { name:'B5',     type:'Paper' },
    { name:'Letter', type:'Paper' },
    { name:'Legal',  type:'Paper' },
  ],
  methods: [
    { name:'setCustom', returnType:'void', params:['float', 'float', 'PaperUnit'] },
    { name:'getHeight', returnType:'float', params:[] },
    { name:'getWidth', returnType:'float', params:[] },
    { name:'Landscape', returnType:'Paper', params:[] },
  ],
  variableDeclaration: /PaperUnit\s+(\w+)\s*=/g,
};