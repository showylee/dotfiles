// Copyright 2022 Adobe. All rights reserved.
// This file is licensed to you under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may obtain a copy
// of the License at http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under
// the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
// OF ANY KIND, either express or implied. See the License for the specific language
// governing permissions and limitations under the License.

/// <reference path="../src/types/esdcorelibinterface.d.ts" />

const path = require('path');
const fs = require('fs');


let scriptOrDirPath = "";
let force = false;

function GetCoreLib()
{
    const platform = process.platform;
    /** @type {import("esdcorelibinterface.node")=} */
    let esdinterface = undefined;

    if (platform === "darwin")
    {
        esdinterface = require("../lib/esdebugger-core/mac/esdcorelibinterface.node");
    }
    else if (platform === "win32")
    {
        const platformArch = process.arch;
        if (platformArch === "x64" || platformArch === "arm64")
        {
            esdinterface = require("../lib/esdebugger-core/win/x64/esdcorelibinterface.node");
        }
        else
        {
            esdinterface = require("../lib/esdebugger-core/win/win32/esdcorelibinterface.node");
        }
    }

    if (esdinterface === undefined)
    {
        console.log("Platform not supported: " + platform);
        process.exit(1);
    }

    return esdinterface;
}

function printUsage()
{
    console.log(`\nUsage: node ${path.basename(__filename)} [options] [filename/directory]\n`);
    console.log("Description: Export the provided file (or files in the provided directory) to jsxbin.");
    console.log("             The files are saved in the same directory with the same names and include the .jsxbin extension.");
    console.log("             Directories will be traversed recursively.\n");
    console.log("Options:");
    console.log("-f, --force        Overwrite the '.jsxbin' file/files if already exists.");
    console.log("-n, --name         The path to a '.js/.jsx' script or to a directory containing such files.");
    console.log("-h, --help         Show this help and exit.\n");
    process.exit(0);
}

function processCommandLineArgs()
{
    const args = process.argv;

    if (args.length < 3 || args.length > 5)
    {
        console.log("Invalid number of arguments");
        printUsage();
        process.exit(1);
    }

    for (let idx = 2; idx < args.length; idx++)
    {
        switch (args[idx])
        {
            case "-f":
            case "--force":
                force = true;
                break;

            case "-n":
            case "--name":
                if (idx < args.length - 1)
                {
                    scriptOrDirPath = args[++idx];
                }
                else
                {
                    printUsage();
                }
                break;

            case "-h":
            case "--help":
            default:
                printUsage();
        }
    }
}

function readFileSyncNoBOM(/** @type {string} */scriptPath)
{
    let content = "";

    try
    {
        content = fs.readFileSync(scriptPath).toString();
        // Remove BOM characters. BOM characters are generally present at the
        //  starting of UTF-8 encoded files coming from a Windows platform.
        if (content)
        {
            content = content.replace(/^\uFEFF/, '');
        }
    }
    catch (error)
    {
        console.log(error);
    }

    return content;
}


function writeToFile(/** @type {string} */filePath, /** @type {string} */text)
{
    try
    {
        if (fs.existsSync(filePath))
        {
            if (force === true)
            {
                fs.writeFileSync(filePath, text);
                console.log("Success: " + filePath);
            }
        }
        else
        {
            fs.writeFileSync(filePath, text);
            console.log("Success: " + filePath);
        }
    }
    catch(error)
    {
        console.log(error);
    }
}

function exportFileToJSXBin(/** @type {string} */scriptPath)
{
    const extName = path.extname(scriptPath).toLowerCase();

    if (extName !== ".jsx" && extName !== ".js")
    {
        console.log("File extension should be .jsx or .js. Not exporting: " + scriptPath);
        return;
    }

    const scriptDirectory = path.dirname(scriptPath);
    const scriptSource = readFileSyncNoBOM(scriptPath);

    const compileResult = GetCoreLib().esdCompileToJSXBin(scriptSource, scriptPath, scriptDirectory);

    let compiledSource = "";
    if (compileResult.status === 0)             // SUCCESS
    {
        compiledSource = compileResult.output;
    }
    else if (compileResult.status === 16)       // JSX_COMPILATION_FAILED
    {
        console.log(`JSX export failed. Error message: ${compileResult.error}`);
    }
    else
    {
        console.error(`JSX export failed. Code: ${compileResult.status}.`);
        process.exit(1);
    }

    const scriptName = path.basename(scriptPath);
    const saveScriptName = `${path.basename(scriptName, path.extname(scriptName))}.jsxbin`;
    const saveScriptPath = path.join(scriptDirectory, saveScriptName);
    
    writeToFile(saveScriptPath, compiledSource);
}

function exportDirectoryFilesToJSXBin(/** @type {string} */dirPath)
{
    try
    {
        const filesList = fs.readdirSync(dirPath);

        filesList.forEach(function(file)
        {
            file = path.resolve(dirPath, file);
            const stat = fs.statSync(file);

            if (stat)
            {
                if (stat.isDirectory())
                {
                    exportDirectoryFilesToJSXBin(file);
                }
                else if (stat.isFile())
                {
                    exportFileToJSXBin(file);
                }
                // else ignore
            }
        });
    }
    catch(error)
    {
        console.log(error);
    }
}

function doExport()
{
    try
    {
        const scPath = path.resolve(scriptOrDirPath);
        const stats = fs.statSync(scPath);

        if (stats.isFile())
        {
            exportFileToJSXBin(scPath);
        }
        else if (stats.isDirectory())
        {
            exportDirectoryFilesToJSXBin(scPath);
        }
        else
        {
            console.log(`${scriptOrDirPath} is neither file nor directory`);
            process.exit(1);
        }
    }
    catch (error)
    {
        console.log(error);
        process.exit(1);
    }
}

function initializeCore()
{
    const result = GetCoreLib().esdInitialize("exportToJSX", process.pid);

    // SUCCESS; ALREADY_INITIALIZED.
    if (result.status !== 0 && result.status !== 11)
    {
        throw new Error(`Failed to initialize core library. Code: ${result.status}.`);
    }

    return result.status;
}

function cleanupCore()
{
    const result = GetCoreLib().esdCleanup();

    // DESTROY_FAILED
    if (result.status === 4)
    {
        throw new Error(`Failed to cleanup core library. Code: ${result.status}.`);
    }
}

processCommandLineArgs();
initializeCore();
doExport();
cleanupCore();
