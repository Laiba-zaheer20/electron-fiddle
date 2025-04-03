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
const fiddle_core_1 = require("@electron/fiddle-core"); // Importing ElectronVersions
function activate(context) {
    // Command to create Electron template
    let createElectronTemplate = vscode.commands.registerCommand('extension.createElectronTemplate', async () => {
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
        // Initialize package.json with default Electron version
        const packageJson = {
            name: folderName,
            version: "1.0.0",
            main: "main.js",
            scripts: {
                start: "electron ."
            },
            dependencies: {
                electron: "latest",
                "electron-reload": "^1.5.0" // Added auto-reload dependency
            }
        };
        fs.writeFileSync(path.join(electronProjectPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        // Create main.js with auto-reload functionality
        const mainJsContent = `const { app, BrowserWindow } = require('electron');
const path = require('path');

// Enable auto-reload for all files in the project
require('electron-reload')(__dirname, {
    electron: require('electron')
});

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
        // Install Electron and dependencies
        vscode.window.showInformationMessage(`Initializing Electron project in "${folderName}"... Installing dependencies...`);
        (0, child_process_1.exec)('npm install', { cwd: electronProjectPath }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error installing dependencies: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Electron template created successfully in "${folderName}"! Run "npm start" to launch.`);
        });
    });
    // Command to change Electron version
    let changeElectronVersion = vscode.commands.registerCommand('extension.changeElectronVersion', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Please open a folder in VS Code before running this command.');
            return;
        }
        const projectPath = workspaceFolders[0].uri.fsPath;
        const electronProjectPath = path.join(projectPath, 'electron-app'); // assuming folder is named 'electron-app'
        // Check if Electron project exists
        if (!fs.existsSync(electronProjectPath)) {
            vscode.window.showErrorMessage('Electron project folder does not exist.');
            return;
        }
        const elves = await fiddle_core_1.ElectronVersions.create(); // Fetch available versions
        const versions = elves.versions.map((ver) => ver.version);
        // Ask the user to select a version from available versions
        const selectedVersion = await vscode.window.showQuickPick(versions, {
            placeHolder: 'Select an Electron version',
            canPickMany: false
        });
        if (!selectedVersion) {
            vscode.window.showErrorMessage('No version selected.');
            return;
        }
        // Update package.json with the selected Electron version
        const packageJsonPath = path.join(electronProjectPath, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        packageJson.dependencies.electron = selectedVersion;
        // Write the updated package.json
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        // Install the selected Electron version
        vscode.window.showInformationMessage(`Installing Electron ${selectedVersion}...`);
        (0, child_process_1.exec)('npm install', { cwd: electronProjectPath }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error installing Electron version: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Electron version ${selectedVersion} installed successfully!`);
        });
    });
    // Register commands
    context.subscriptions.push(createElectronTemplate);
    context.subscriptions.push(changeElectronVersion);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map