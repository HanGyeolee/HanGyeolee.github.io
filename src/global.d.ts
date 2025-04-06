interface FileObject{
    name: string,
    url: string,
    type: string,
    id?:string
}

interface Files{
    file: FileObject[],
    assets: FileObject[],
    resource: FileObject[]
}

interface RawFiles{
    file: File[],
    assets: File[],
    resource: File[]
}

type FileWrapper = 'file' | 'assets' | 'resource';

interface Window {
    uploadedFiles?: Files;
}