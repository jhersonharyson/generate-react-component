import * as vscode from 'vscode';
import { ComponentType, FormatTypesExampleEnum } from './enums';
import { FormatNameProps, CreateFilesProps } from './interfaces';
import { formatNameFile, formatNameComponent, generateFiles, generateFolder, writeFile } from './utils';
export function activate(context: vscode.ExtensionContext) {


	function folderSelected() {
		const getFolder = vscode.workspace.workspaceFolders;
		if (getFolder) {
			const lastFolder = getFolder[getFolder.length - 1];
			return lastFolder.uri.fsPath;
		}
		return false;
	}

	let disposable = vscode.commands.registerCommand('generate-react-component.gc', async (uri) => {

		const getConfigurations = async () => {
			try {
				const root = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0])?.uri.fsPath;
				const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(root + "/grc.json"));
				const config: any = JSON.parse(fileContent.toString());

				const styleStrategy: null | 'styled-components' | 'no-library' | 'no-style' = config.generateOptions.styleStrategy;
				const namingStrategy: null | 'kebab' | 'pascal' = config.generateOptions.namingStrategy;
				const typeStrategy: null | 'types' | 'interface' | 'without-interfaces' = config.generateOptions.typeStrategy;
				const moduleStrategy: null | 'common' | 'esnext' = config.generateOptions.moduleStrategy;
				const componentTypeStrategy: null | 'component' | 'page' = config.generateOptions.componentTypeStrategy;

				return { styleStrategy, namingStrategy, typeStrategy, moduleStrategy, componentTypeStrategy };
			} catch (e) {
				return {};
				// vscode.window.showInformationMessage(`Cannot read grc.json`);
			}
		};

		const { styleStrategy, namingStrategy, typeStrategy, moduleStrategy, componentTypeStrategy } = await getConfigurations();


		// Now you can use the 'config' object with the file content
		// vscode.window.showInformationMessage(`Read file content: ${fileContent}`);


		let selectedFolderPath: string | null = null;
		if (uri && uri.scheme === 'file') {
			selectedFolderPath = uri.fsPath;
			vscode.window.showInformationMessage(`Selected Folder: ${selectedFolderPath}`);
			// Now you can use the selectedFolderPath for your logic
		} else {
			// If the command is triggered from another context, you can handle it accordingly
			vscode.window.showInformationMessage('Command triggered from an unsupported context.');
		}


		async function getNameComponent() {
			const name = await vscode.window.showInputBox({
				placeHolder: "Ex.: button group",
				prompt: "Enter the name of the component",
				value: "",
				validateInput: (value: string) => {
					if (value.length === 0) {
						return "Component name is required";
					}
					return null;
				}
			});
			return name ? name : false;
		}

		async function getSelectedPath() {

			if (selectedFolderPath) {
				return selectedFolderPath;
			}

			const folder = await vscode.window.showQuickPick([
				{
					label: "Choose folder",
					description: "",
					detail: "",
					picked: true
				}
			], {
				placeHolder: "Choose folder"
			}) as vscode.QuickPickItem;
			if (folder.label === "Default folder") {
				return folderSelected() + "/src/components/";
			}
			const folderPath = await vscode.window.showOpenDialog({
				canSelectFiles: false,
				canSelectFolders: true,
				canSelectMany: false,
				openLabel: "Select folder"
			});
			return folderPath ? folderPath[0].fsPath : false;

		}

		async function chooseLibrary() {
			
			if(styleStrategy) {
				return styleStrategy;
			}

			const library = await vscode.window.showQuickPick([
				// {
				// 	label: "Material UI",
				// 	description: "",
				// 	detail: "",
				// 	picked: true,
				// 	value: "material-ui"
				// },
				{
					label: "Styled Components",
					description: "",
					detail: "",
					picked: false,
					value: "styled-components"
				},
				{
					label: "Create style without library",
					description: "",
					detail: "",
					picked: false,
					value: "no-library"
				},
				{
					label: "Don't create style",
					description: "",
					detail: "",
					picked: false,
					value: "no-style"
				}

			], {
				placeHolder: "Choose library"
			}) as any;
			return library ? library.value : false;
		}

		async function chooseFormatNameFiles() {

			if(namingStrategy) {
				return namingStrategy;
			}

			const format = await vscode.window.showQuickPick([
				{
					label: "Kebab Case",
					description: FormatTypesExampleEnum.kebab,
					detail: "",
					picked: false,
					value: "kebab"
				},
				{
					label: "Pascal Case",
					description: FormatTypesExampleEnum.pascal,
					detail: "",
					picked: false,
					value: "pascal"
				}

			], {
				placeHolder: "Choose file name format"
			}) as any;
			return format ? format.value : false;
		}

		async function chooseComponentType() {

			if(componentTypeStrategy){
				return componentTypeStrategy;
			}

			const format = await vscode.window.showQuickPick([
				{
					label: "Component",
					description: ComponentType.component,
					detail: "",
					picked: false,
					value: "component"
				},
				{
					label: "Page",
					description: ComponentType.page,
					detail: "",
					picked: false,
					value: "page"
				}

			], {
				placeHolder: "Choose component type"
			}) as any;
			return format ? format.value : false;
		}

		async function chooseWithInterface() {

			if(typeStrategy) {
				return typeStrategy;
			}

			const withInterface = await vscode.window.showQuickPick([
				{
					label: "@types",
					description: "use folder with name @types",
					detail: "",
					picked: false,
					value: 'types'
				},
				{
					label: "interfaces",
					description: "use folder with name interfaces",
					detail: "",
					picked: false,
					value: 'interfaces'
				},
				{
					label: "No",
					description: "",
					detail: "",
					picked: false,
					value: 'without-interfaces'
				}

			], {
				placeHolder: "Create interface?"
			}) as any;
			return withInterface ? withInterface.value : false;
		}

		async function createFiles({ nameComponent, componentType, pathSelected, chooseLibrary, chooseFormatNameFiles, chooseInterface: chooseInterface }: CreateFilesProps) {
			const formatName = formatNameFile({ chosenNameFormat: chooseFormatNameFiles, nameComponent } as FormatNameProps);
			const pathComponent = generateFolder({ pathSelected, nameComponent: formatName, chooseInterface: chooseInterface });
			const formatNameFunctionComponent = formatNameComponent({ nameComponent } as FormatNameProps);

			const files = generateFiles({
				nameComponent: formatName,
				componentType: componentType,
				pathComponent: pathComponent,
				generateStyle: chooseLibrary !== "no-style",
				generateInterface: chooseInterface,
			});

			if (["types", "interfaces"].includes(chooseInterface)) {
				await writeFile({
					pathFile: files.interfaceGenerated,
					contentFile: "export interface " + formatNameFunctionComponent.nameComponent + "Props {\n\ttitle: string;\n}\n"
				});

				await writeFile({
					pathFile: files.exportInterfaceGenerated,
					contentFile: "export * from './" + formatName + "-props.interface';"
				});
			}


			switch (chooseLibrary) {
				case "styled-components":
					writeFile({
						pathFile: files.styleGenerated,
						contentFile: "import styled from 'styled-components';\n\nexport const Container = styled.div``;\n"
					});

					if (["types", "interfaces"].includes(chooseInterface)) {
						writeFile({
							pathFile: files.componentGenerated,
							contentFile: "import type { " + formatNameFunctionComponent.nameComponent + "Props } from './" + (chooseInterface === "types" ? '@types' : 'interfaces') + "';\n\nimport * as S from './" + formatName + "-styles';\n\nexport function " + formatNameFunctionComponent.nameFunctionComponent + "({title}: " + formatNameFunctionComponent.nameComponent + "Props) {\n	return (\n		<S.Container>Hello World</S.Container>\n	);\n}"
						});
					} else {
						writeFile({
							pathFile: files.componentGenerated,
							contentFile: "import * as S from './" + formatName + "-styles'; \n\nexport function " + formatNameFunctionComponent.nameFunctionComponent + "() {\n	return (\n		<S.Container>Hello World</S.Container>\n	);\n};"
						});
					}
					break;
				case "no-library":
					writeFile({
						pathFile: files.styleGenerated,
						contentFile: "export const container = {};\n"
					});

					if (["types", "interfaces"].includes(chooseInterface)) {
						writeFile({
							pathFile: files.componentGenerated,
							contentFile: "import { container } from './" + formatName + "-styles'; \nimport { " + formatNameFunctionComponent.nameComponent + "Props } from './" + (chooseInterface === "types" ? '@types' : 'interfaces') + "';\n\nexport function " + formatNameFunctionComponent.nameFunctionComponent + "({title}: " + formatNameFunctionComponent.nameComponent + "Props) {\n	return (\n		<div className={container}>Hello World</div>\n	);\n}\n\nexport default " + formatNameFunctionComponent.nameFunctionComponent + ";"
						});
					} else {
						writeFile({
							pathFile: files.componentGenerated,
							contentFile: "import { container } from './" + formatName + "-styles'; \n\nexport function " + formatNameFunctionComponent.nameFunctionComponent + "() {\n	return (\n		<div className={container}>Hello World</div>\n	);\n}\n\nexport default " + formatNameFunctionComponent.nameFunctionComponent + ";"
						});
					}
					break;
				case "no-style":
					if (["types", "interfaces"].includes(chooseInterface)) {
						writeFile({
							pathFile: files.componentGenerated,
							contentFile: "import type { " + formatNameFunctionComponent.nameComponent + "Props } from './" + (chooseInterface === "types" ? '@types' : 'interfaces') + "';\n\nexport function " + formatNameFunctionComponent.nameFunctionComponent + "({title}: " + formatNameFunctionComponent.nameComponent + "Props) {\n	return (\n		<h1>Hello World</h1>\n	);\n}\n\nexport default " + formatNameFunctionComponent.nameFunctionComponent + ";"
						});
					} else {
						writeFile({
							pathFile: files.componentGenerated,
							contentFile: "function " + formatNameFunctionComponent.nameFunctionComponent + "() {\n	return (\n		<h1>Hello World</h1>\n	);\n}\n\nexport default " + formatNameFunctionComponent.nameFunctionComponent + ";"
						});
					}
					break;
			}

			if (["types", "interfaces"].includes(chooseInterface)) {
				writeFile({
					pathFile: files.testGenerated,
					contentFile: "import { render, screen } from '@testing-library/react';\nimport { " + formatNameFunctionComponent.nameFunctionComponent + " } from './" + formatName + "';\n\nconst makeSut = () => render(<" + formatNameFunctionComponent.nameFunctionComponent + " title='Hello World' />);\n\ndescribe('" + formatNameFunctionComponent.nameFunctionComponent + "', () => {\n	test('should render', () => {\n		makeSut(); \n	const title = screen.getByRole('heading');\n	expect(title).toBeInTheDocument();\n\n	});\n});\n"
				});
			} else {
				writeFile({
					pathFile: files.testGenerated,
					contentFile: "import { render, screen } from '@testing-library/react';\nimport { " + formatNameFunctionComponent.nameFunctionComponent + " } from './" + formatName + "';\n\nconst makeSut = () => render(<" + formatNameFunctionComponent.nameFunctionComponent + " />);\n\ndescribe('" + formatNameFunctionComponent.nameFunctionComponent + "', () => {\n	test('should render', () => {\n		makeSut(); \n	const title = screen.getByRole('heading');\n	expect(title).toBeInTheDocument();\n\n	});\n});\n"
				});
			}

			if (componentType === 'page') {
				writeFile({
					pathFile: files.exportComponentGenerated,
					contentFile: "import { " + formatNameFunctionComponent.nameComponentExport + " } from './" + formatName + "';\n\nconst Page = () => {\n\treturn <" + formatNameFunctionComponent.nameComponentExport + " " + (chooseInterface ? "title={'" + formatNameFunctionComponent.nameFunctionComponent + "'}" : "") + " />;\n}\n\nexport default Page;"
				});
			} else {
				writeFile({
					pathFile: files.exportComponentGenerated,
					contentFile: "export { " + formatNameFunctionComponent.nameComponentExport + " } from './" + formatName + "';"
				});
			}



			vscode.window.showInformationMessage(`Component ${nameComponent} created successfully 🚀`);
		}

		if (!getNameComponent() || !getSelectedPath() || !chooseLibrary()) {
			vscode.window.showInformationMessage("Something went wrong 😢");
			return;
		}
		const nameComponent = await getNameComponent();
		const pathSelected = await getSelectedPath();
		const componentType = await chooseComponentType();
		const library = await chooseLibrary();
		const withInterface: string = await chooseWithInterface();

		const formatNameFiles = await chooseFormatNameFiles();
		createFiles({
			nameComponent,
			componentType,
			pathSelected,
			chooseLibrary: library,
			chooseFormatNameFiles: formatNameFiles,
			chooseInterface: withInterface,
		});

	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
