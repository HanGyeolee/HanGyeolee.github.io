export interface LibraryProps{
    name: string;
    methods: {
        name: string;
        returnType: string;
        params: string[];
        isStatic?:boolean;
    }[];
    variableDeclaration: RegExp,
    staticMethods?: RegExp,
    methodChain: RegExp
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
    GRAY= 'gray'
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
  Left='left',
  Center='center',
  Right='right',
  Justify='justify'
};

export enum Fit {
  FILL='fill',
  CONTAIN='contain',
  COVER='cover'
};

export enum Orientation {
  Vertical='vertical',
  Horizontal='horizontal'
};