// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AwsVaultDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
    private awsVaultManager: AwsVaultManager;

    constructor(awsVaultManager: AwsVaultManager) {
        this.awsVaultManager = awsVaultManager;
    }

    async resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        token?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration | null | undefined> {
        const currentProfile = this.awsVaultManager.getCurrentProfile();
        
        // Only modify if we have a selected profile and AWS Vault is installed
        if (!currentProfile) {
            return config;
        }

        const isInstalled = await this.awsVaultManager.checkAwsVaultInstalled();
        if (!isInstalled) {
            return config;
        }

        try {
            // Get AWS credentials from aws-vault for the selected profile
            // Use --no-session to avoid interactive prompts and add timeout
            const { stdout } = await execAsync(`aws-vault exec ${currentProfile} --no-session -- env | grep AWS_`, {
                timeout: 10000 // 10 second timeout
            });
            const awsEnvVars: { [key: string]: string } = {};
            
            // Parse AWS environment variables
            stdout.split('\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && trimmedLine.includes('=')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    const value = valueParts.join('=');
                    if (key.startsWith('AWS_')) {
                        awsEnvVars[key] = value;
                    }
                }
            });

            // Merge AWS environment variables into the debug configuration
            if (Object.keys(awsEnvVars).length > 0) {
                config.env = {
                    ...config.env,
                    ...awsEnvVars
                };

                // Show notification that debug session will use AWS Vault profile
                vscode.window.showInformationMessage(
                    `Debug session will run with AWS Vault profile: ${currentProfile}`
                );
            }

        } catch (error) {
            // If --no-session fails, try without it but with a shorter timeout
            try {
                const { stdout } = await execAsync(`aws-vault exec ${currentProfile} -- env | grep AWS_`, {
                    timeout: 5000 // 5 second timeout
                });
                const awsEnvVars: { [key: string]: string } = {};
                
                stdout.split('\n').forEach(line => {
                    const trimmedLine = line.trim();
                    if (trimmedLine && trimmedLine.includes('=')) {
                        const [key, ...valueParts] = trimmedLine.split('=');
                        const value = valueParts.join('=');
                        if (key.startsWith('AWS_')) {
                            awsEnvVars[key] = value;
                        }
                    }
                });

                if (Object.keys(awsEnvVars).length > 0) {
                    config.env = {
                        ...config.env,
                        ...awsEnvVars
                    };

                    vscode.window.showInformationMessage(
                        `Debug session will run with AWS Vault profile: ${currentProfile}`
                    );
                }
            } catch (secondError) {
                vscode.window.showWarningMessage(
                    `Failed to get AWS credentials for profile ${currentProfile}. This may require interactive input (MFA). Consider using the terminal integration instead.`
                );
            }
        }

        return config;
    }
}

class AwsVaultManager {
    private statusBarItem: vscode.StatusBarItem;
    private refreshStatusBarItem: vscode.StatusBarItem;
    private currentProfile: string | null = null;
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Load previously selected profile
        this.loadSavedProfile();
        
        // Main status bar item for profile selection
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
        this.statusBarItem.command = 'vscode-aws-vault.selectProfile';
        this.statusBarItem.tooltip = 'Click to select AWS Vault profile';
        
        // Refresh icon status bar item
        this.refreshStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 99);
        this.refreshStatusBarItem.text = '$(refresh)';
        this.refreshStatusBarItem.command = 'vscode-aws-vault.refreshProfiles';
        this.refreshStatusBarItem.tooltip = 'Refresh AWS Vault profiles';
        
        this.updateStatusBar();
        this.statusBarItem.show();
        this.refreshStatusBarItem.show();
    }

    private loadSavedProfile() {
        const savedProfile = this.context.globalState.get<string>('awsVaultSelectedProfile');
        if (savedProfile) {
            this.currentProfile = savedProfile;
        }
    }

    private saveProfile() {
        this.context.globalState.update('awsVaultSelectedProfile', this.currentProfile);
    }

    private updateStatusBar() {
        if (this.currentProfile) {
            this.statusBarItem.text = `$(cloud) AWS Vault: ${this.currentProfile}`;
        } else {
            this.statusBarItem.text = `$(cloud) AWS Vault`;
        }
    }

    async checkAwsVaultInstalled(): Promise<boolean> {
        try {
            await execAsync('aws-vault --version');
            return true;
        } catch (error) {
            return false;
        }
    }

    async getProfiles(): Promise<string[]> {
        try {
            const { stdout } = await execAsync('aws-vault list --profiles');
            return stdout.trim().split('\n').filter(profile => profile.trim() !== '');
        } catch (error) {
            throw new Error(`Failed to get AWS Vault profiles: ${error}`);
        }
    }

    async selectProfile(): Promise<void> {
        const isInstalled = await this.checkAwsVaultInstalled();
        
        if (!isInstalled) {
            const action = await vscode.window.showErrorMessage(
                'AWS Vault is not installed. Please install it to use this extension.',
                'Open Installation Guide'
            );
            
            if (action === 'Open Installation Guide') {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/99designs/aws-vault/tree/master'));
            }
            return;
        }

        try {
            const profiles = await this.getProfiles();
            
            if (profiles.length === 0) {
                vscode.window.showInformationMessage('No AWS Vault profiles found. Please add profiles using aws-vault.');
                return;
            }

            const profileItems = profiles.map(profile => ({
                label: profile,
                description: profile === this.currentProfile ? 'Currently selected' : ''
            }));

            // Only add "Clear Selection" option if a profile is currently selected
            if (this.currentProfile) {
                profileItems.unshift({
                    label: '$(x) Clear Selection',
                    description: 'Remove current profile selection'
                });
            }

            const selected = await vscode.window.showQuickPick(profileItems, {
                placeHolder: 'Select an AWS Vault profile',
                title: 'AWS Vault Profiles'
            });

            if (selected) {
                if (selected.label === '$(x) Clear Selection') {
                    this.currentProfile = null;
                } else {
                    this.currentProfile = selected.label;
                }
                this.saveProfile(); // Save to persistent storage
                this.updateStatusBar();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error loading AWS Vault profiles: ${error}`);
        }
    }

    async launchTerminal(): Promise<void> {
        const isInstalled = await this.checkAwsVaultInstalled();
        
        if (!isInstalled) {
            const action = await vscode.window.showErrorMessage(
                'AWS Vault is not installed. Please install it to use this extension.',
                'Open Installation Guide'
            );
            
            if (action === 'Open Installation Guide') {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/99designs/aws-vault/tree/master'));
            }
            return;
        }

        let profileToUse = this.currentProfile;

        // If no profile is selected, prompt user to select one
        if (!profileToUse) {
            try {
                const profiles = await this.getProfiles();
                
                if (profiles.length === 0) {
                    vscode.window.showInformationMessage('No AWS Vault profiles found. Please add profiles using aws-vault.');
                    return;
                }

                const profileItems = profiles.map(profile => ({
                    label: profile,
                    description: ''
                }));

                const selected = await vscode.window.showQuickPick(profileItems, {
                    placeHolder: 'Select an AWS Vault profile for terminal',
                    title: 'Launch Terminal with AWS Vault Profile'
                });

                if (!selected) {
                    return; // User cancelled
                }

                profileToUse = selected.label;
            } catch (error) {
                vscode.window.showErrorMessage(`Error loading AWS Vault profiles: ${error}`);
                return;
            }
        }

        // Create and launch terminal with AWS Vault profile
        const terminal = vscode.window.createTerminal({
            name: `AWS Vault: ${profileToUse}`,
            shellPath: undefined, // Use default shell
            shellArgs: undefined,
            env: {
                ...process.env // Inherit current environment
            }
        });

        // Send the aws-vault exec command to the terminal
        terminal.sendText(`aws-vault exec ${profileToUse} -- $SHELL`);
        terminal.show();

        vscode.window.showInformationMessage(`Launched terminal with AWS Vault profile: ${profileToUse}`);
    }

    getCurrentProfile(): string | null {
        return this.currentProfile;
    }

    dispose() {
        this.statusBarItem.dispose();
        this.refreshStatusBarItem.dispose();
    }
}

let awsVaultManager: AwsVaultManager;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('AWS Vault extension is now active!');

    // Initialize the AWS Vault manager
    awsVaultManager = new AwsVaultManager(context);

    // Register command to select profile
    const selectProfileCommand = vscode.commands.registerCommand('vscode-aws-vault.selectProfile', () => {
        awsVaultManager.selectProfile();
    });

    // Register command to refresh profiles
    const refreshProfilesCommand = vscode.commands.registerCommand('vscode-aws-vault.refreshProfiles', () => {
        awsVaultManager.selectProfile();
    });

    // Register command to launch terminal with profile
    const launchTerminalCommand = vscode.commands.registerCommand('vscode-aws-vault.launchTerminal', () => {
        awsVaultManager.launchTerminal();
    });

    // Register debug configuration provider for all debug types
    const debugConfigProvider = new AwsVaultDebugConfigurationProvider(awsVaultManager);
    const debugProviderDisposables = [
        vscode.debug.registerDebugConfigurationProvider('*', debugConfigProvider)
    ];

    context.subscriptions.push(
        selectProfileCommand, 
        refreshProfilesCommand,
        launchTerminalCommand,
        ...debugProviderDisposables,
        awsVaultManager
    );
}

// This method is called when your extension is deactivated
export function deactivate() {
    if (awsVaultManager) {
        awsVaultManager.dispose();
    }
}
