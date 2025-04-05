export interface LibraryProps{
  type: 'Class'|'Enum',
  name: string;
  extend?: string;
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
  variableDeclaration: RegExp,
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
  HELVETICA='Helvetica, Arial, sans-serif',
  HELVETICA_BOLD='Helvetica-Bold, Arial, sans-serif',
  TIMES_ROMAN='Times New Roman, serif',
  TIMES_BOLD='Times-Bold, Times New Roman, serif',
  COURIER='Courier, monospace',
  COURIER_BOLD='Courier-Bold, monospace'
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