#!/usr/bin/env node
require("./command-runner").run(async () => {
    // -----------------------------------------------------------------------------------------
    // #region Imports
    // -----------------------------------------------------------------------------------------

    const azure          = require("./_modules/azure");
    const deployConfig   = require("./_modules/deploy-config");
    const echo           = require("./_modules/echo");
    const frontendPath   = require("./_modules/frontend-path");
    const program        = require("commander");
    const shell          = require("shelljs");
    const webpackPublish = require("./_modules/webpack-publish");

    // #endregion Imports

    // -----------------------------------------------------------------------------------------
    // #region Variables
    // -----------------------------------------------------------------------------------------

    let   clientId            = null;
    let   destination         = null;
    const pythonInstallerUrl  = "https://www.python.org/ftp/python/3.7.4/python-3.7.4-amd64.exe";
    let   recursive           = false;
    let   secret              = null;
    let   sourcePath          = frontendPath.publishDir() + "/*";
    let   tenantId            = null;
    let   username            = null;

    // #endregion Variables

    /// -----------------------------------------------------------------------------------------
    // #region Functions
    // -----------------------------------------------------------------------------------------

    const deployAzureStorage = {
        cmd() {
            let command = `az storage copy -s ${sourcePath} -d ${destination}`;

            if (recursive) {
                command += " --recursive";
            }

            return command;
        },
        description() {
            return "Publish build artifacts to Azure Storage";
        },
        run() {
            // Check system/command requirements
            this.validateOrExit();

            // Configure .env.local to set public url before publish
            if (program.publicUrl) {
                deployConfig.configurePublicUrl(program.publicUrl);
            }

            // Locally publish frontend via webpack
            if (program.publish && program.webpack) {
                const publishResult = webpackPublish.run();
                if (!publishResult) {
                    shell.exit(1);
                }
            }

            // Login to Azure
            if (username != null) {
                azure.login(username, secret);
            } else {
                azure.login(clientId, tenantId, secret);
            }

            // Deploy build artifacts to Azure Storage
            echo.message("Copying local build artifacts to Azure Storage...");
            echo.message(` - Source path: ${sourcePath}`);
            echo.message(` - Destination path: ${destination}`);

            const copyCommand = this.cmd();
            echo.message(` - Command: ${copyCommand}`);
            if (shell.exec(copyCommand, { silent: false }).code !== 0) {
                echo.error(" - Failed to deploy to Azure Storage");
                azure.logout();
                shell.exit(1);
            }

            // Logout from Azure
            azure.logout();

            echo.newLine();
            echo.success("Application successfully deployed to Azure Storage!");
        },
        validateOrExit() {
            const errors = [];

            // Validate arguments
            clientId = program.clientId;
            tenantId = program.tenantId;
            username = program.username;

            const missingServicePrincipalArgs = (clientId == null || tenantId == null);

            if (username == null && missingServicePrincipalArgs) {
                errors.push("when --client-id or --tenant-id not provided, --username is required");
            }

            secret = program.secret;
            if (secret == null) {
                errors.push("--secret is required");
            }

            destination = program.destination;
            if (destination == null) {
                errors.push("--destination is required");
            }

            if (program.source != null) {
                sourcePath = program.source;
            }

            if (program.recursive != null) {
                recursive = program.recursive;
            }

            // Bail if up-front arguments are errored
            if (errors.length > 0) {
                echo.errors(errors);
                shell.exit(1);
            }

            if (!shell.which("az")) {
                echo.message("Azure CLI not found. Attempting install via PIP...");

                if (!shell.which("pip")) {
                    echo.error(`PIP is required - ${pythonInstallerUrl}`);
                    shell.exit(1);
                }

                if (shell.exec("pip install azure-cli").code !== 0) {
                    echo.error("Failed to install azure cli via pip");
                    shell.exit(1);
                }

                echo.success(" - Successfully installed Azure CLI");
            }

            // Handle errors
            if (errors.length > 0) {
                echo.errors(errors);
                shell.exit(1);
            }

            return true;
        },
    };

    // #endregion Functions

    // -----------------------------------------------------------------------------------------
    // #region Entrypoint
    // -----------------------------------------------------------------------------------------

    program
        .usage("option")
        .description(deployAzureStorage.description())
        .option("--client-id <clientID>",      "Required Client ID (if deploying using Service Principal)")
        .option("--destination <destination>", "Required absolute container URL path (ie. https://workingenv.blob.core.windows.net/folder/subfolder)")
        .option("--public-url <url>",          "Optional URL replaced in release files (ie. absolute Azure CDN or container URL)")
        .option("--publish",                   "Optional flag to run a webpack publish")
        .option("--recursive",                 "Optional flag to recursively deploy a folder")
        .option("--secret <profile>",          "Required secret for login -- either client secret for service principal or account password")
        .option("--source <source>",           `Optional path of folder to copy from this machine. Default is '${frontendPath.publishDir()}'`)
        .option("--tenant-id <tenantID>",      "Required Tenant ID (if deploying using Service Principal)")
        .option("--username <username>",       "Required Azure username (if deploying using Azure credentials)")
        .option("--webpack",                   "Deploy webpack built frontend application")
        .parse(process.argv);

    await deployAzureStorage.run();

    // #endregion Entrypoint
});
