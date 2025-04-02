"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
function activate(context) {
    let disposable = vscode.commands.registerCommand('extension.createElectronTemplate', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a folder in VS Code before running this command.');
            return;
        }
        const projectPath = workspaceFolders[0].uri.fsPath;
        // Ask the user for a folder name
        const folderName = await vscode.window.showInputBox({
            prompt: 'Enter a name for the Electron project folder',
            value: 'electron-app'
        });
        if (!folderName) {
            vscode.window.showErrorMessage('Folder name cannot be empty.');
            return;
        }
        const electronProjectPath = path.join(projectPath, folderName);
        // Create Electron project folder
        if (!fs.existsSync(electronProjectPath)) {
            fs.mkdirSync(electronProjectPath);
        }
        else {
            vscode.window.showErrorMessage(`Folder "${folderName}" already exists.`);
            return;
        }
        // Initialize package.json
        const packageJson = {
            name: folderName,
            version: "1.0.0",
            main: "main.js",
            scripts: {
                start: "electron ."
            },
            dependencies: {
                electron: "latest"
            }
        };
        fs.writeFileSync(path.join(electronProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        // Create main.js
        const mainJsContent = `const { app, BrowserWindow } = require('electron');

app.whenReady().then(() => {
    const mainWindow = new BrowserWindow({ width: 800, height: 600 });
    mainWindow.loadFile('index.html');
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});`;
        fs.writeFileSync(path.join(electronProjectPath, 'main.js'), mainJsContent);
        // Create index.html
        const indexHtmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Electron App</title>
</head>
<body>
    <h1>Hello from Electron!</h1>
</body>
</html>`;
        fs.writeFileSync(path.join(electronProjectPath, 'index.html'), indexHtmlContent);
        // Install Electron
        vscode.window.showInformationMessage(`Initializing Electron project in "${folderName}"... Installing dependencies...`);
        (0, child_process_1.exec)('npm install', { cwd: electronProjectPath }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error installing dependencies: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Electron template created successfully in "${folderName}"! Run "npm start" to launch.`);
        });
    });
    context.subscriptions.push(disposable);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map