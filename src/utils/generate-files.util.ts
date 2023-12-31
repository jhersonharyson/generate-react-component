import { ComponentType } from "../enums";

interface GenerateFilesPros{
  pathComponent: string;
  componentType: string;
  nameComponent: string;
  generateStyle: boolean;
  generateInterface: string;
}

export const generateFiles = ({pathComponent, componentType, nameComponent, generateStyle, generateInterface}: GenerateFilesPros) => {
  const fs = require('fs');
	const path = require('path');

  const generateFileComponent = path.join(pathComponent, nameComponent + '.tsx');
  const generateFileTest = path.join(pathComponent, nameComponent + '.spec.tsx');
  const generateFileStyle = generateStyle && path.join(pathComponent, nameComponent + '-styles.ts');
  const generateFileExportComponent = path.join(pathComponent, 'component' ===  componentType ? 'index.ts' : 'page.tsx');
  const generateFileInterface = ["types", "interfaces"].includes(generateInterface) && path.join(pathComponent, generateInterface === "types" ? '@types' : 'interfaces', nameComponent + '-props.interface.ts');
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