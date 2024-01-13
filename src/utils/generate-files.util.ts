import { ComponentType } from "../enums";

interface GenerateFilesPros{
  pathComponent: string;
  componentType: string;
  nameComponent: string;
  styleType: string;
  generateInterface: string;
}

const getStyleFileExtension = (styleType: string) => {
  const extensions: any = {
    "css": ".css",
    "sass": ".scss",
    "styled-components": ".ts",
    "css-modules": ".ts",  
  }

  return extensions[styleType] || ".ts"
}

export const generateFiles = ({pathComponent, componentType, nameComponent, styleType, generateInterface}: GenerateFilesPros) => {
  const fs = require('fs');
	const path = require('path');

  const generateFileComponent = path.join(pathComponent, nameComponent + '.tsx');
  const generateFileTest = path.join(pathComponent, nameComponent + '.spec.tsx');
  const generateFileStyle = styleType !== "no-style" && path.join(pathComponent, 'styles' + getStyleFileExtension(styleType));
  const generateFileExportComponent = path.join(pathComponent, 'component' ===  componentType ? 'index.ts' : 'page.tsx');
  const generateFileInterface = ["types", "interfaces"].includes(generateInterface) && path.join(pathComponent, generateInterface === "types" ? '@types' : 'interfaces', nameComponent + '.d.ts');
  const generateFileExportInterface = ["types", "interfaces"].includes(generateInterface) && path.join(pathComponent, generateInterface === "types" ? '@types' : 'interfaces', 'index.ts');

  return {
    componentGenerated: generateFileComponent,
    testGenerated: generateFileTest,
    styleGenerated: generateFileStyle,
    exportComponentGenerated: generateFileExportComponent,
    interfaceGenerated: generateFileInterface,
    exportInterfaceGenerated: generateFileExportInterface
  };

};