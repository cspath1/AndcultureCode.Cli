// -----------------------------------------------------------------------------------------
// #region Imports
// -----------------------------------------------------------------------------------------

const dir        = require("./dir");
const dotnetPath = require("./dotnet-path");
const echo       = require("./echo");
const shell      = require("shelljs");

// #endregion Imports

// -----------------------------------------------------------------------------------------
// #region Functions
// -----------------------------------------------------------------------------------------

const dotnetPublish = {
    cmd(outputDirectory) {
        if (outputDirectory === undefined || outputDirectory === null) {
            return "dotnet publish";
        }

        return `dotnet publish -o "${outputDirectory}"`;
    },
    description() {
        return `Publishes the dotnet solution from the root of the project (via ${this.cmd()})`;
    },

    /**
     * Runs a publish of the dotnet solution to the local file system
     * @param {string} absoluteOutputDir Optional absolute path of release output directory. If not provided,
     * defaults to dotnet solution's 'release' directory
     */
    run(absoluteOutputDir) {

        if (absoluteOutputDir === undefined || absoluteOutputDir === null) {
            absoluteOutputDir = dotnetPath.releaseDir();
        }

        echo.message(`Cleaning release directory '${absoluteOutputDir}'...`);

        const rmExecResult = shell.rm("-rf", absoluteOutputDir);
        if (rmExecResult.code !== 0) {
            echo.error("Failed to delete output directory");
            shell.exit(rmExecResult.code);
        }

        echo.success(" - Successfully cleaned released directory");
        echo.newLine();

        dir.pushd(dotnetPath.solutionDir());
        echo.message(`Publishing dotnet solution (via ${this.cmd(absoluteOutputDir)})...`);

        const execResult = shell.exec(this.cmd(absoluteOutputDir))
        if (execResult.code !== 0) {
            echo.error("Failed to publish dotnet project");
            shell.exit(execResult.code);
        }

        echo.success(" - Dotnet solution published")
        dir.popd();
    },
};

// #endregion Functions

// -----------------------------------------------------------------------------------------
// #region Exports
// -----------------------------------------------------------------------------------------

module.exports = dotnetPublish;

// #endregion Exports