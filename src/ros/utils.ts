// Copyright (c) Andrew Short. All rights reserved.
// Licensed under the MIT License.

import * as child_process from "child_process";
import * as os from "os";
import * as vscode from "vscode";

import * as extension from "../extension";
import * as pfs from "../promise-fs";
import * as telemetry from "../telemetry-helper";

/**
 * Executes a setup file and returns the resulting env.
 */
export function sourceSetupFile(filename: string, env?: any): Promise<any> {
    return new Promise((resolve, reject) => {
        let exportEnvCommand: string;
        if (process.platform === "win32") {
            exportEnvCommand = `cmd /c "\"${filename}\" && set"`;
        }
        else {
            exportEnvCommand = `bash -c "source '${filename}' && env"`;
        }

        let processOptions: child_process.ExecOptions = {
            cwd: extension.baseDir,
            env: env,
        };
        child_process.exec(exportEnvCommand, processOptions, (error, stdout, _stderr) => {
            if (!error) {
                resolve(stdout.split(os.EOL).reduce((env, line) => {
                    const index = line.indexOf("=");

                    if (index !== -1) {
                        env[line.substr(0, index)] = line.substr(index + 1);
                    }

                    return env;
                }, {}));
            } else {
                reject(error);
            }
        });
    });
}

export function xacro(filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
        let processOptions = {
            cwd: extension.baseDir,
            env: extension.env,
            windowsHide: false,
        };

        let xacroCommand: string;
        if (process.platform === "win32") {
            xacroCommand = `cmd /c "xacro "${filename}""`;
        } else {
            xacroCommand = `bash -c "xacro '${filename}' && env"`;
        }

        child_process.exec(xacroCommand, processOptions, (error, stdout, _stderr) => {
            if (!error) {
                resolve(stdout);
            } else {
                reject(error);
            }
        });
    });
}

/**
 * Gets the names of installed distros.
 */
export function getDistros(): Promise<string[]> {
    return pfs.readdir("/opt/ros");
}

/**
 * Creates and shows a ROS-sourced terminal.
 */
export function createTerminal(context: vscode.ExtensionContext) {
    const reporter = telemetry.getReporter(context);
    reporter.sendTelemetryCommand(extension.Commands.CreateTerminal);

    vscode.window.createTerminal({ name: 'ROS', env: extension.env }).show();
}
