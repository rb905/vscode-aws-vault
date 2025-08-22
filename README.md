# VSCode AWS Vault

A VS Code extension that integrates with AWS Vault to help you manage and select AWS profiles directly from your editor.

## Features

- **Status Bar Integration**: Shows current AWS Vault profile in the bottom status bar with a refresh icon
- **Profile Selection**: Click the status bar item to select from available AWS Vault profiles
- **Profile Persistence**: Selected profile is remembered between VS Code sessions
- **Quick Refresh**: Click the refresh icon next to the AWS Vault item to refresh profiles
- **Terminal Integration**: Launch a new terminal with the selected AWS Vault profile environment
- **Debug Integration**: Automatically injects AWS credentials from the selected profile
- **Profile Management**: Lists all configured AWS Vault profiles in a quick pick menu
- **Installation Check**: Automatically detects if AWS Vault is installed and provides installation guidance

## Requirements

This extension requires AWS Vault to be installed on your system. If AWS Vault is not installed, the extension will:
1. Show an error message
2. Provide a link to the official installation guide

### Installing AWS Vault

Visit the official AWS Vault repository for installation instructions:
[https://github.com/99designs/aws-vault/tree/master](https://github.com/99designs/aws-vault/tree/master)

## How to Use

1. **View Current Profile**: Look at the status bar (bottom of VS Code) for the AWS Vault icon and current profile
2. **Select Profile**: Click on the "AWS Vault" status bar item to open the profile selection menu
3. **Refresh Profiles**: Click the refresh icon (🔄) next to the AWS Vault item to refresh the profile list
4. **Launch Terminal**: Use Command Palette (`Cmd+Shift+P`) → "AWS Vault: Launch Terminal with Profile" to open a terminal with AWS credentials
5. **Clear Selection**: Choose "Clear Selection" from the profile menu to remove the current selection

When a profile is selected, the status bar will show: `☁️ AWS Vault: your-profile-name`

### Terminal Integration
- If you have a profile selected, the terminal will launch with that profile
- If no profile is selected, you'll be prompted to choose one before launching
- The terminal runs `aws-vault exec <profile> -- $SHELL` to provide AWS credentials in the environment

### Debug Integration  
- When you run any debug configuration (F5 or "Run and Debug"), the extension automatically injects AWS credentials from the selected profile
- Uses `aws-vault exec` to get temporary credentials and adds them to the debug session environment
- Works with all debug types (Node.js, Python, etc.) that respect environment variables
- Only applies when an AWS Vault profile is selected
- Shows a notification indicating which profile is being used for the debug session

## Commands

This extension contributes the following commands:

- `AWS Vault: Select Profile` - Opens the profile selection menu
- `AWS Vault: Refresh Profiles` - Refreshes and opens the profile selection menu  
- `AWS Vault: Launch Terminal with Profile` - Opens a new terminal with AWS Vault profile environment

## Extension Settings

This extension doesn't add any VS Code settings at this time.

## Known Issues

- Profiles must be configured in AWS Vault before they appear in the extension
- The extension requires AWS Vault to be available in the system PATH

## Release Notes

### 0.0.1

Initial release with basic AWS Vault profile selection functionality.

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
