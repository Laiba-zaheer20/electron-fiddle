import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { Runner, ElectronVersions, FiddleFactory, Paths } from '@electron/fiddle-core';

let runningProcess: any = null;

export function activate(context: vscode.ExtensionContext) {
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
        } else {
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
        exec('npm install', { cwd: electronProjectPath }, (error, stdout, stderr) => {
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

        const elves = await ElectronVersions.create(); // Fetch available versions
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
        exec('npm install', { cwd: electronProjectPath }, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`Error installing Electron version: ${stderr}`);
                return;
            }
            vscode.window.showInformationMessage(`Electron version ${selectedVersion} installed successfully!`);
        });
    });

    // Command to start the fiddle
    let startFiddleCommand = vscode.commands.registerCommand('extension.startFiddle', async () => {
        const fiddlePath = await vscode.window.showInputBox({
            prompt: 'Enter path to fiddle or URL (Gist, GitHub, or local directory)',
            value: ''
        });

        if (fiddlePath) {
            startFiddle(fiddlePath);
        }
    });

    // Command to stop the fiddle
    let stopFiddleCommand = vscode.commands.registerCommand('extension.stopFiddle', async () => {
        stopFiddle();
    });

    // Register commands
    context.subscriptions.push(createElectronTemplate);
    context.subscriptions.push(changeElectronVersion);
    context.subscriptions.push(startFiddleCommand);
    context.subscriptions.push(stopFiddleCommand);
}

export function deactivate() {
    stopFiddle();
}

async function startFiddle(fiddlePath: string) {
    try {
        // Define the paths where the necessary Electron files will be stored
        const paths: Paths = {
            electronDownloads: '/tmp/my/electron-downloads', // Store downloaded Electron versions
            electronInstall: '/tmp/my/electron-install',     // Store installed Electron versions
            fiddles: '/tmp/my/fiddles',                       // Store fiddles
            versionsCache: '/tmp/my/releases.json',           // Store versions 
        };

        const runner = await Runner.create({ paths });

        // Create a factory to load the fiddle from the Gist
        const factory = new FiddleFactory();

        // Load the fiddle from the folder for now - we can open from Gist or any repo
        const fiddle = await factory.fromFolder(fiddlePath);
        console.log('Fiddle files:', fiddle);
        // Start the fiddle using Runner.spawn with a specific Electron version(electron version can be asked from user)
        runningProcess = await runner.spawn('35.0.0', fiddle, {
            stdio: 'inherit', // inherits stdout and stderr for the process
        });

        vscode.window.showInformationMessage("Fiddle started successfully.");
    } catch (error : any) {
        vscode.window.showErrorMessage("Error starting the fiddle: " + error.message);
    }
}

// Stop the fiddle by killing the process
async function stopFiddle() {
    if (runningProcess) {
        runningProcess.kill('SIGINT');  // Send a signal to stop the process
        vscode.window.showInformationMessage("Fiddle stopped successfully.");
        runningProcess = null;
    } else {
        vscode.window.showInformationMessage("No running fiddle to stop.");
    }
}
