import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

export function activate(context: vscode.ExtensionContext) {
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
        } else {
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
        exec('npm install', { cwd: electronProjectPath }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error installing dependencies: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Electron template created successfully in "${folderName}"! Run "npm start" to launch.`);
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
