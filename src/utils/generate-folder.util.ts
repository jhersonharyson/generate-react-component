interface GenerateFolderPros{
  pathSelected: string | false;
  nameComponent: string | false;
  chooseInterface: string;
}

export const generateFolder = ({pathSelected, nameComponent, chooseInterface}: GenerateFolderPros) => {
  const fs = require('fs');
	const path = require('path');

  const pathComponent = path.join(pathSelected, nameComponent);
  if(!fs.existsSync(pathComponent)){
    fs.mkdirSync(pathComponent);
    
    if(chooseInterface === "types"){
      const pathInterface = path.join(pathComponent, '@types');
      fs.mkdirSync(pathInterface);
    }
    
    if(chooseInterface === "interfaces"){
      const pathInterface = path.join(pathComponent, 'interfaces');
      fs.mkdirSync(pathInterface);
    }
  }
  return pathComponent;
};