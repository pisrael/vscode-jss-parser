'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const css2Jss_1 = require("./css2Jss");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('"Jss-parser" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.convert2Jss', () => {
        // The code you place here will be executed every time your command is executed
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }
        const selection = editor.selection;
        const docText = editor.document.getText(selection);
        const converter = new css2Jss_1.Css2JssConverter(docText);
        let parsedText = converter.parse();
        parsedText = parsedText.replace(/"(\w+)"\:/g, (match, name) => {
            return `${name}:`;
        });
        editor.edit(builder => {
            builder.replace(selection, parsedText);
        }).then((success) => {
            if (!success) {
                vscode.window.showErrorMessage('Failed to apply JSSParse fixes to the document.');
            }
        });
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map