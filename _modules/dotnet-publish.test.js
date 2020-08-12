// -----------------------------------------------------------------------------------------
// #region Imports
// -----------------------------------------------------------------------------------------

const shell         = require("shelljs");
const dotnetPublish = require("./dotnet-publish");
const dir           = require("./dir");
const dotnetPath = require("./dotnet-path");

// #endregion Imports

// -----------------------------------------------------------------------------------------
// #region Tests
// -----------------------------------------------------------------------------------------

describe("dotnetPublish", () => {
    let shellExecSpy;
    let shellExitSpy;
    let shellRmSpy;

    beforeEach(() => {
        shellExecSpy = jest.spyOn(shell, "exec").mockImplementation(() => {
            return { code: 0 }
        });
        shellExitSpy = jest.spyOn(shell, "exit").mockImplementation(() => {
            return { code: 0 }
        });
        shellRmSpy   = jest.spyOn(shell, "rm").mockImplementation(() => {
            return { code: 0 }
        });
    });

    // -----------------------------------------------------------------------------------------
    // #region run
    // -----------------------------------------------------------------------------------------

    describe("run", () => {
        test("when shell.rm() returns non-zero exit code, then calls shell.exit() with shell.exec() exit code", () => {
            // Arrange
            const exitCode = 1;
            shellRmSpy     = jest.spyOn(shell, "rm").mockImplementation(() => {
                return { code: exitCode }
            });

            // Act
            dotnetPublish.run();

            // Assert
            expect(shellRmSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(exitCode)
        });

        test("when shell.exec() returns non-zero exit code, then calls shell.exit() with shell.exec() exit code", () => {
            // Arrange
            const exitCode = 1;
            shellExecSpy   = jest.spyOn(shell, "exec").mockImplementation(() => {
                return { code: exitCode }
            });

            // Act
            dotnetPublish.run();

            // Assert
            expect(shellExecSpy).toHaveBeenCalled();
            expect(shellExitSpy).toHaveBeenCalledWith(exitCode)
        });

        test("when run command successfully completes, then calls dir.popd()", () => {
            // Arrange
            const dirPopdSpy = jest.spyOn(dir, "popd").mockImplementation(() => { return; });

            // Act
            dotnetPublish.run();

            // Assert
            expect(dirPopdSpy).toHaveBeenCalled();
        });

        test("when absoluteOutputDir is supplied, then calls this.cmd() with absoluteOutputDir value", () => {
            // Arrange
            const cmdMock           = jest.spyOn(dotnetPublish, "cmd").mockImplementation(() => { return; });
            const absoluteOutputDir = "C:\\Some\\Absolute\\Path";

            // Act
            dotnetPublish.run(absoluteOutputDir);

            // Assert
            expect(cmdMock).toHaveBeenCalledWith(absoluteOutputDir);
        });

        test("when absoluteOutputDir is not supplied, then calls this.cmd() with the result of dotnetPath.releaseDir()", () => {
            // Arrange
            const releaseDir = "Some\\Relative\\Path";
            const cmdMock = jest
                .spyOn(dotnetPublish, "cmd")
                .mockImplementation(() => { return; });
            const releaseDirMock = jest
                .spyOn(dotnetPath, "releaseDir")
                .mockImplementation(() => { return releaseDir; })

            // Act
            dotnetPublish.run();

            // Assert
            expect(cmdMock).toHaveBeenCalledWith(releaseDir);
        })
    });

    // #endregion run
});

// #endregion Tests