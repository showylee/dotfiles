# ExtendScript Debugger Extension for VS Code

A VS Code Extension that enables debugging ExtendScript scripts and extensions in Adobe’s ExtendScript-enabled applications.

> _**Warning for Apple Silicon Users (e.g. M1)**_: The extension does not run in native builds of VS Code but it **does** work with Intel/universal builds using Rosetta. Please see the [Known Issues](#known-issues) below for information on how to use the extension.

## Supported features

- [Breakpoints](https://code.visualstudio.com/docs/editor/debugging#_breakpoints)
  - [Conditional Breakpoints](https://code.visualstudio.com/docs/editor/debugging#_conditional-breakpoints)
    - Expression Condition
    - Hit Count
  - Exception Breakpoints
    - Caught Exceptions **¹**
- [Logpoints](https://code.visualstudio.com/docs/editor/debugging#_logpoints)
- Call Stack View
- Variables View
  - Local and Global Scope
  - Modify variables
- [Debug Actions](https://code.visualstudio.com/docs/editor/debugging#_debug-actions)
  - Continue / Pause
  - Step Over
  - Step Into
  - Step Out
  - Restart
  - Disconnect / Stop
- [Debug Console](https://code.visualstudio.com/docs/editor/debugging#_debug-console-repl)
  - Expression Evaluation
- Expression Evaluation of Code on Hover **²**
- Script Evaluation and Halting
- Export ExtendScript to JSXBin

<small>**¹** _Changes to the Caught Exceptions setting while a script is running or stopped at a breakpoint will only apply to scopes created after the setting is changed._<br/>
**²** _Requires active debug session._</small>

## Unsupported Features

- Profiling Support
- Object Model Viewer (OMV)
- Auto-Completion
- Scripts Panel

## Getting Started

### Installation

[Install the extension](https://marketplace.visualstudio.com/items?itemName=Adobe.extendscript-debug) through [the usual means](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-an-extension).

The extension requires VS Code v1.62 or newer.

### Migration from V1 Versions

The ExtendScript Debugger V2 is a complete rewrite of the V1 version. The internals received a complete overhaul that substantially increased stability, performance, flexibility, and improved compatibility with native VS Code features. As a result of this overhaul, the launch configuration properties have changed. The following is a table of properties that have been renamed:

| V1 | V2 |
| --- | --- |
| `targetSpecifier` | `hostAppSpecifier` |
| `program` | `script` |
| `excludes` | `hiddenTypes` |

The `engineName` and `debugLevel` properties remain unchanged. All other V1 properties have been removed and will be ignored. Please see the [Advanced Configuration](#advanced-configuration) section for a full listing of configuration properties available in V2.

Additionally, the manner in which the extension operates has changed _dramatically_. It is highly recommended that you read the following section as it provides an overview of how to use this extension with three common use cases.

## Using the Debugger

This extension was designed to support a wide variety of use cases. Three common use cases are outlined below to provide guidance on how certain features may be used.

### Running a Script

The extension supports running (evaluating) a script in a host application without an active debug session. This functionality may be triggered via the [`Evaluate Script in Host...`](#evaluate-script-in-host) command or by clicking the [_Eval in Adobe..._](#eval-in-adobe-button) button.

### Debugging a Script

The most direct way to debug a script in the extension is to start a debug session configured with a `launch` [request type](#attach-and-launch-mode-support). Such a debug session will connect to the specified host engine, inform it that the debugger is active, and then trigger the script evaluation. Any breakpoints or uncaught exceptions will cause VS Code to show the debug state and enable interacting with the host application. Once the script evaluation is complete, the debug session will clean itself up and shut down.

### Debugging Event Callbacks

Debugging ExtendScript triggered via a callback (e.g. with ScriptUI or CEP) requires that the debugger be connected when that script is run. A `launch` debug session is only active when the originating script is processed by the host application and will therefore miss debug messages from the host application in these circumstances.

To debug ExtendScript triggered by callbacks, start a debug session configured with an `attach` [request type](#attach-and-launch-mode-support). Such a debug session will connect to the specified host engine, inform it that the debugger is active, and then wait for debug messages from the connected engine. Any breakpoints or uncaught exceptions encountered by the host engine while your `attach` debug session is active will cause VS Code to show the debug state and enable interacting with the host application. This debug session will remain active until explicitly disconnected or stopped.

Additional notes:

- Scripts may also be [evaluated](#running-a-script) while an `attach` debug session is active.
- CEP environments in particular may benefit from a [compound launch configuration](#compound-launch-configurations) to debug both scripting environments simultaneously.

## Debugger Configuration

The ExtendScript Debugger is capable of debugging with and without a standard [launch configuration](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations).

### Zero Configuration

If you have not yet defined a `launch.json` file in your project, the [Run and Debug view](https://code.visualstudio.com/docs/editor/debugging#_run-view) will show the "Run and Debug" button. If you click this button while a file recognized as "JavaScript" (`.js`) or "JavaScript React" (`.jsx`) is the active file in VS Code, you will be given the option to select "ExtendScript" in the list of debugger options in the dropdown.

When you select "ExtendScript", you will be asked to select a [Debugging Mode](#attach-and-launch-mode-support). Once you have made your choice, simply select your target host application and, if applicable, the target engine and the debug session will start.

### Launch Configuration

Setting up a launch configuration allows you to simplify and customize the process of starting a debug session. To start, please follow the standard steps to [initialize a launch configuration](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations).

When you add a new ExtendScript configuration to your `launch.json`, it will contain only the minimum settings required to start debugging. Shown below is the default `attach` request configuration:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "extendscript-debug",
            "request": "attach",
            "name": "Attach to ExtendScript Engine"
        }
    ]
}
```

With the configuration above, you can select the "Attach To ExtendScript Engine" option in VS Code's Debug and Run view and initiate a debug session. Because no host application is specified, the extension will look up installed applications and show a list from which you may select a target. If your selected application is running and supports multiple engines, the extension will then ask which engine should be debugged. Once your selections are made, the debug session will begin.

See the "Advanced Configuration" section below for an explanation of available configuration options.

#### Attach and Launch Mode Support

VS Code [supports](https://code.visualstudio.com/docs/editor/debugging#_launch-versus-attach-configurations) two debug session request types: `attach` and `launch`. Both are supported by the ExtendScript Debugger extension and have distinct meaning:

- **`attach` Requests:** Launch configurations with request type `attach` will connect to an ExtendScript engine running within a host application and provide it with a listing of active breakpoint information. Once this connection is established, breakpoints and debug logging will be active for any script processed by the engine, whether triggered from within the host application itself or by an Evaluation process from VS Code. The connection will remain open until it is explicitly closed using the "Disconnect" or "Stop" [debug actions](https://code.visualstudio.com/docs/editor/debugging#_debug-actions).
- **`launch` Requests:** Launch configurations with request type `launch` will connect to an ExtendScript engine running within a host application, provide it with a listing of active breakpoint information, and then trigger the evaluation of a specified script. The resulting debug session will remain active as long as the script evaluation process does not end or until the session is explicitly closed using the "Stop" or "Disconnect" [debug actions](https://code.visualstudio.com/docs/editor/debugging#_debug-actions).

The main difference between `attach` and `launch` requests is that the life of a `launch` mode debug session is tied directly to the length of time it takes the host engine to process the script. For short scripts, this may result in VS Code appearing to "flash" into and out of the "debugger active" state. This does not happen for `attach` configurations because the debug session connection is not tied to any specific script evaluation. For this reason, it is highly recommended that `attach` request debug sessions be used when debugging scripts that contain asynchronous callbacks (e.g. ScriptUI or CEP).

#### Recommended Configuration Names

VS Code [currently](https://github.com/microsoft/vscode/issues/151299) uses a “play” button for both `attach` and `launch` mode debug configurations. This can lead to confusion as many users expect that pressing a “play” button will result in their script being run. When an `attach` mode configuration is selected, this will **not** happen. As such, we recommend that users name their `attach` mode configurations starting with “Attach to” and `launch` mode configurations starting with “Launch in” (or the like) to avoid this ambiguity.

#### Compound Launch Configurations

The ExtendScript Debugger extension supports [Compound Launch Configurations](https://code.visualstudio.com/docs/editor/debugging#_compound-launch-configurations). Scenarios where this may be of interest include:

- **Debugging CEP contexts.** [CEP extensions](https://github.com/Adobe-CEP/CEP-Resources) support two main scripting contexts: a JavaScript context and an ExtendScript context. These contexts have the ability to interact via certain message passing APIs. A compound configuration would allow you to start debug sessions in both the JavaScript and ExtendScript contexts with a single click. See:
  ```json
  {
      "version": "0.2.0",
      "configurations": [
          {
              "type": "chrome",
              "request": "attach",
              "name": "[Attach] CEP JavaScript",
              "port": 7777,   // <-- Whatever debug port you have configured.
              "webRoot": "${workspaceRoot}",
              "pathMapping": {
                  "/": "${workspaceRoot}"
              }
          },
          {
              "type": "extendscript-debug",
              "request": "attach",
              "name": "[Attach] CEP ExtendScript",
              "hostAppSpecifier": "premierepro-22.0"
          }
      ],
      "compounds": [
          {
              "name": "[Compound] Debug CEP",
              "configurations": [
                  "[Attach] CEP JavaScript",
                  "[Attach] CEP ExtendScript"
              ]
          }
      ]
  }
  ```
- **Debugging Engine to Engine Messaging.** When passing messages back and forth between multiple ExtendScript engines in the same or different host applications, it may be helpful to debug both engines simultaneously. Compound Launch Configurations make this easy:
  ```json
  {
      "version": "0.2.0",
      "configurations": [
          {
              "type": "extendscript-debug",
              "request": "attach",
              "name": "Attach to InDesign Coordinator",
              "hostAppSpecifier": "indesign-17.064",
              "engineName": "MyCoordinator"
          },
          {
              "type": "extendscript-debug",
              "request": "attach",
              "name": "Attach to Premiere Pro",
              "hostAppSpecifier": "premierepro-22.0"
          }
      ],
      "compounds": [
          {
              "name": "[Compound] Debug ID-to-PPro",
              "configurations": [
                  "Attach to InDesign Coordinator",
                  "Attach to Premiere Pro",
                  // ...
              ]
          }
      ]
  }
  ```

Please keep in mind that the `name` fields in launch configurations are entirely customizable and are not used by the ExtendScript Debugger. The use of "[Attach]", "[Launch]", "[Compound]", "Attach to", and "Launch in" within the `name` fields is simply intended to assist with [configuration disambiguation](#recommended-configuration-names).

### Advanced Configuration

The following configuration options are accepted by both `attach` and `launch` debug configurations:

| Property | Type | Description | Default Value |
| --- | --- | --- | --- |
| `hostAppSpecifier` | string | The [application specifier](#identifying-application-specifiers) of the host application to debug. | `""` |
| `engineName` | string | The name of the engine to target. | `""` |
| `hiddenTypes` | string[] | <div>An array of data types and class names that should be hidden in the Variables view. Valid names are:<p><ul><li> `"undefined"`</li><li>`"null"`</li><li>`"boolean"`</li><li>`"number"`</li><li>`"string"`</li><li>`"object"`</li><li>`"this"`</li><li>`"prototype"`</li><li>`"builtin"`</li><li>`"Function"`</li><li>any valid ExtendScript class name</li></ul></p>The string `"this"` hides the `this` object. The string `"prototype"` hides all elements from the prototype chain, and the string `"builtin"` hides all elements that are part of the core ExtendScript language.</div> | `[]` |
| `aliasPath` | string | The absolute path to a file system alias (symbolic link) for the root directory loaded by a host application. | `""` |
| `registeredSpecifier` | string | <p>A secondary application specifier that matches what the host application registered as its specifier during installation as opposed to the one it actually uses for BridgeTalk communication.</p>_**NOTE:** This is used only in very specific circumstances to assist in host application connections. At present, only InDesign Server connections make use of this._ | `""` |

The following configuration options are accepted by `launch` debug configurations only:

| Property | Type | Description | Default Value |
| --- | --- | --- | --- |
| `script` | string | The absolute path to the script to debug in the host application. If not specified, the contents of the active editor will be used. | `""` |
| `bringToFront` | boolean | Whether to bring the host application to front when starting the debug session or not. | `false` |
| `debugLevel` | number | The debugging level:<p><ul><li>`0` - No debugging.</li><li>`1` - Break on breakpoints, errors, or exceptions.</li><li>`2` - Stop at the first executable line.</li></ul></p> | `1` |

**Notes:**

- If the `script` property is specified, then only the **saved** state of the script will be evaluated in the host application. In other words, **unsaved modifications are ignored** when a script is specified using this property.

### Debugging

Starting an ExtendScript `attach` mode debug session in VS Code does not run any scripts in the connected host application - it merely informs the host application that a debugger is ready to debug. There are many ways to trigger a script to run while an `attach` mode debug session is active:

- Run a script in the host application directly (specifics are determined by the host application).
- Load a CEP extension panel in a host application that supports debugging CEP contexts.
- Interact with a UI element that triggers some ExtendScript to run in a host application (e.g. in a CEP panel or ScriptUI within an app that supports debugging such contexts).
- Run the `ExtendScript: Evaluate Script in Host...` command.
- Run the `ExtendScript: Evaluate Script in Attached Host...` command.

Any breakpoint, error, or exception encountered while an ExtendScript debug session is active will cause VS Code to show the debug state and enable interacting with the host application.

The above does not apply to `launch` mode debug sessions because `launch` mode debug sessions will run a script automatically when started.

#### Remote Debugging

The ExtendScript Debugger extension does not currently support [Remote Debugging](https://code.visualstudio.com/docs/editor/debugging#_remote-debugging).

### Identifying Application Specifiers

Every Adobe application has a unique [application specifier](https://extendscript.docsforadobe.dev/interapplication-communication/application-and-namespace-specifiers.html?highlight=specifier#application-specifiers). This extension most commonly refers to them with the name `hostAppSpecifier`. The application specifier for a specific installed application may easily be discovered by starting a debug session _without_ the `hostAppSpecifier` property set. When the resulting pick list appears, the grey text to the right of the application name is that application’s specifier.

## VS Code Commands

The ExtendScript Debugger extension adds the following [Commands](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) to VS Code:

- `Evaluate Script in Host...`
- `Evaluate Script in Attached Host...`
- `Halt Script in Host...`
- `Clear Error Highlights...`
- `Export As Binary...`

These commands may be triggered from the [Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette) or by [custom key bindings](https://code.visualstudio.com/docs/getstarted/keybindings#_command-arguments). The key bindings approach provides access to several configuration options for the `Evaluate Script in Host...` and `Evaluate Script in Attached Host...` commands.

### Evaluate Script in Host

The ExtendScript Debugger extension provides an `Evaluate Script in Host...` command which enables VS Code to instruct a host application to evaluate a given script within a specific engine. If an `attach` mode debug session is active for the specified engine when the command is triggered, then any configured breakpoints may cause the script to pause. If a `launch` mode debug session is active for the specified engine when the command is triggered, then the command will fail as the extension allows only a single script evaluation to be active in an engine at any given time. If no `attach` mode debug session is active when the command is triggered, then breakpoints are ignored.

When triggered, the command will show a list of installed host applications from which to select a target. If the host application has multiple ExtendScript engines running, a second list showing these options will appear. After the application and engine have been selected, the **contents of the currently active editor** will be sent to the host application for evaluation.

**Notes:**

- This command will fail if the host application is not yet running. Please ensure that the desired host application is running before triggering this command.
- Upon successful evaluation, the final result will be shown in an information message box.
- If an error occurs during evaluation, any details regarding the error will appear in an error message box.
- The file does **not** need to be saved in order to be sent to the host application for evaluation.

#### Custom Key Binding Arguments

The most flexible way to trigger the `Evaluate Script in Host...` command is to create a [custom key binding](https://code.visualstudio.com/docs/getstarted/keybindings#_command-arguments). When you configure a custom key binding, you not only gain the ability to more quickly trigger the command, but you have the ability to specify the available command arguments.

The command string is `extension.extendscript-debug.evalInHost` and the available command arguments include:

| Argument | Type | Description | Default Value |
| --- | --- | --- | --- |
| `hostAppSpecifier` | string | [Specifier](#identifying-application-specifiers) for the host application within which to evaluate the file. If not specified, a prompt will appear. | `""` |
| `engineName` | string | Name of the engine to target. Will use the default engine if not specified. If two or more engines are available, a prompt will appear. | `""` |
| `script` | string | Absolute path to the script file to evaluate. If not specified, the contents of the active editor will be used. | `""` |
| `bringToFront` | boolean | Whether to bring the host application to front when evaluating or not. | `false` |
| `debugLevel` | number | The debugging level:<p><ul><li>`0` - No debugging.</li><li>`1` - Break on breakpoints, errors, or exceptions.</li><li>`2` - Stop at the first executable line.</li></ul></p>This only applies when evaluating while a debug session with the host application is active. | `1` |
| `registeredSpecifier` | string | <p>A secondary specifier that matches what the host application registered as its specifier during installation as opposed to the one it actually uses for BridgeTalk communication.</p>_**NOTE:** This is used only in very specific circumstances to assist in host application connections. At present, only InDesign Server connections make use of this._ | `""` |

Example of a configured key binding:

```json
{
    "key": "cmd+alt+j",
    "command": "extension.extendscript-debug.evalInHost",
    "args": {
        "hostAppSpecifier": "indesign-16.064",
        "engineName": "MyCoordinator",
        "debugLevel": 2,
    }
}
```

When triggered, the command above would cause the contents of the currently active editor to be sent to the "MyCoordinator" engine in InDesign and, if a debug session was active, pause on the first executable line of the script.

**Notes:**

- If the `script` argument is specified, then only the **saved** state of the file will be evaluated in the host application. In other words, **unsaved modifications are ignored** when a path is specified using this feature.

### Evaluate Script in Attached Host

The `Evaluate Script in Attached Host...` command is very similar to the `Evaluate Script in Host...` command. The difference is that instead of requiring that you specify a specific host application and engine, the command will evaluate the script in an engine for which an `attach` mode debug session is active. How the command operates depends upon how many `attach` mode debug sessions are active when the command is triggered:

- **Zero Active Sessions:** The command will attempt to start an `attach` mode debug session and will ask which host application and, if applicable, engine to target. Once the debug session starts, the script evaluation will begin.
- **One Active Session:** The command will immediately evaluate the script in the engine targeted by the active debug session.
- **Multiple Active Sessions:** The command will present a list of the active `attach` mode debug sessions and allow you to select which to target for script evaluation.

The command string is `extension.extendscript-debug.evalInAttachedHost`. The command supports the same set of configurable command arguments as `Evaluate Script in Host...` except that the `hostAppSpecifier`, `engineName`, and `registeredSpecifier` fields are ignored (they are supplied directly by the debug session).

### Halt Script in Host

The `Halt Script in Host...` command enables you to halt (terminate/stop/end) any active evaluation process that was initially started with the `Evaluate Script in Host...` command. If there is only a single active evaluation process when this command is triggered, then that evaluation will be halted. If there are multiple active evaluation processes when the command is triggered, then the command will show a list of active evaluation processes that may be halted. Selecting one from this list will halt the selected evaluation.

The command string is `extension.extendscript-debug.haltInHost` and there are no configurable command arguments.

### Clear Error Highlights

Triggering the `Clear Error Highlights...` command will clean up any active ExtendScript error highlights.

The command string is `extension.extendscript-debug.clearErrorHighlights` and there are no configurable command arguments.

### Export to JSXBin

You can export your `.js` and `.jsx` scripts to JSXBin by right-clicking the editor window of a `.js` or `.jsx` file and selecting `Export As Binary...`. A file name suggestion will be provided. If you proceed with the export, the results will be saved in the same directory as your currently opened file. You can enter a complete path for the output if desired.

The command string is `extension.extendscript-debug.exportToJSXBin` and there are no configurable command arguments.

## VS Code Status Bar Buttons

The ExtendScript Debugger extension adds two new buttons to the [Status Bar](https://code.visualstudio.com/docs/getstarted/userinterface) that appear/disappear based on context.

### _Eval in Adobe..._ Button

This button appears when a document either:

1. [recognized by VS Code](https://code.visualstudio.com/docs/languages/identifiers#_known-language-identifiers) as `javascript`, `javascriptreact`, or `extendscript`, or
2. has a file extension of `.jsxbin`

is focused. Clicking this button triggers the `Evaluate Script in Host...` command. Once a target host application/engine combination is chosen, the contents of the focused document will be evaluated within it.

When an `attach` mode debug session is active, the _Eval in Adobe..._ button changes to read _Eval in Adobe [name of application] (engine)..._. Clicking this button will evaluate the focused script in the application being debugged.

### _Halt in Adobe..._ Button

This button appears when a script evaluation is triggered from within VS Code. If only a single evaluation process is actively running, then the button will read _Halt in Adobe [name of application] (engine)..._ and clicking it will immediately halt that evaluation process.

If more than one evaluation process is active, then the button will read _Halt in Adobe..._ and clicking it will open a list showing all active evaluation processes. Selecting a process from this list will cause that process to halt.

## Batch Export to JSXBin

By using the `Export As Binary...` command as described above, you can export one file at a time. However you can also batch export your `.js` and `.jsx` files to JSXBin using a script provided with the extension.

1. Ensure that you have NodeJS installed.
2. Locate the script at the following location:
   - Mac:
     ```
     $HOME/.vscode/extensions/<adobe.extendscript-debug extension directory>/public-scripts/exportToJSXBin.js
     ```
   - Windows:
     ```
     %USERPROFILE%\.vscode\extensions\<adobe.extendscript-debug extension directory>\public-scripts\exportToJSXBin.js
     ```
3. Run the following command from terminal.
   ```
   node <Path to exportToJSXBin.js> [options] [filename/directory]
   ```

## InDesign Server (or When Host Applications Go Rogue)

During installation InDesign Server registers itself incorrectly for communication with other applications (including debuggers). The result is that the debugger is able to access certain information about the application but it fails to make any connections to running instances. To correct for this, the ExtendScript Debugger contains several configuration options and settings to enable the extension's features to correctly interface with InDesign Server instances.

The ExtendScript Debugger extension supports per-configuration properties and "global" settings to work around the issue.

### The `registeredSpecifier` Property/Argument

A `registeredSpecifier` property may be specified in debug configurations and custom key binding arguments for the `Evaluate Script in Host...` command. This property refers to the specifier that the host application registers for itself during installation. When this property is present, the `hostAppSpecifier` is used for communicating with the host application while the `registeredSpecifier` is used to resolve application metadata (like it's "Display Name"). For most applications, the registered specifier is the same one used for communication so specifying the value is unnecessary.

An example pairing might look like:

```json
"hostAppSpecifier": "indesignserver_myconfig-17.064",
"registeredSpecifier": "indesignserver-17.0",
```

Properly setting the `registeredSpecifier` debug configuration property or key binding argument will allow only that specific configuration to work. See below for a more "global" solution.

### The "Application Specifier Overrides" Extension Setting

The "Application Specifier Overrides" extension [setting](https://code.visualstudio.com/docs/getstarted/settings) enables full control over how the extension interprets any `hostAppSpecifier` value it encounters. With proper configuration, this setting will enable the default `Evaluate Script in Host...` command and related features to work with "default" InDesign Server instances (those started _without_ a custom `port` or `configuration`). It also enables you to skip adding the `registeredSpecifier` property/argument in configurations.

The setting expects an array of objects with the following properties:

| Property | Type | Description | Default Value |
| --- | --- | --- | --- |
| `appSpecRegExp` | string | A JavaScript regular expression value that is used to test against “Host Application Specifier” values for applicability. This applies to any custom `hostAppSpecifier` used in either debug configurations or custom key binding arguments. Proper declaration of the regular expression will allow custom application instances to resolve as expected. | `""` |
| `registeredSpecifier` | string | The specifier that the host application registers for itself during installation. | `""` |
| `commsSpecifier` | string | The specifier by which the "default" application instance will communicate. | `""` |

Taken together, these properties constitute two “sets” of information:

1. Specifying the `appSpecRegExp` and `registeredSpecifier` values will effectively add the `registeredSpecifier` property to any debug configuration or key binding argument where `appSpecRegExp` matches the `hostAppSpecifier`.
2. Specifying the `commsSpecifier` and `registeredSpecifier` values will enable the base `Evaluate Script in Host...` command and _Eval in Adobe..._ button to work with the default instance of the specified application.

Example:

```json
"extendscript.advanced.applicationSpecifierOverrides": [
    {
        "appSpecRegExp": "indesignserver[_a-z0-9]*-17",
        "registeredSpecifier": "indesignserver-17.0",
        "commsSpecifier": "indesignserver-17.064"
    }
]
```

The `appSpecRegExp` in the example above will successfully match against a `hostAppSpecifier` with value "indesignserver_myconfig-17.064" and will instruct any configuration in which it was found to use the `registeredSpecifier` value of "indesignserver-17.0". Additionally, if the `Evaluate Script in Host...` command is run without custom arguments, then the extension will match the `registeredSpecifier` value of "indesignserver-17.0" against the specifier it automatically uses, find that they are the same, and then use the `commsSpecifier` value of "indesignserver-17.064" for communication. If a "default" InDesign Server 2022 instance is running, then the script evaluation process will proceed as expected.

**Notes:**

- This feature can be used to point the _Eval in Adobe..._ button and base `Evaluate Script in Host...` command to a specific instance. This is only recommended if you _always_ use the same application instance (e.g. InDesign Server port and configuration settings). In such cases, simply specify the full instance specifier for the `commsSpecifier` property.

## General Notes

- If the ExtendScript Toolkit (ESTK) connects to a host application, then the ExtendScript Debugger extension will no longer be able to function correctly as a debugger. Restarting the host application is enough to fix this issue.
- A single host application can only be debugged by a single VS Code window. If two or more VS Code windows attempt to maintain debug sessions with a single host application at the same time, only the last one to connect will work.
- A single VS Code window can manage multiple debug sessions with multiple host application/engine combinations at the same time.
- Changes to the "Caught Exceptions" breakpoint while a script is evaluating (e.g. stopped at a breakpoint) will only apply to newly created scopes (stack frames).
- When an `Evaluate Script in Host...` command is run without an active debug session and fails with an error status, the extension will highlight the line of source code reported with the error. You may clear these highlights in one of the following manners:
   1. Focus another source file such that the source file with a highlight becomes a background tab in VS Code.
   1. Close and reopen the source file.
   1. Start another script evaluation.
   1. Start a debug session.
   1. If the "Show Result Messages" setting is enabled, dismiss the relevant error message (if hidden, click the notification bell in the right side of the status bar).
   1. Run the `Clear Error Highlights...` command.
- The ExtendScript Debugger extension ignores the [`#target`](https://extendscript.docsforadobe.dev/extendscript-tools-features/preprocessor-directives.html#target-name) and [`#targetengine`](https://extendscript.docsforadobe.dev/extendscript-tools-features/preprocessor-directives.html#targetengine-enginename) preprocessor directives. The extension will always use either the configured `hostAppSpecifier` and `engineName` settings or, if not otherwise specified, those dynamically chosen in the relevant UI.
- When _disconnecting_ from a Debug Session:
  - The host engine is instructed to unregister all VS Code breakpoints and continue evaluation.
  - Any script-based breakpoints (e.g. `debugger` or `$.bp()`) subsequently encountered by the host engine will cause the host engine to pause and await communication from a debugger. When this occurs, the extension will attempt to notify you and offer you the ability to attach a debug session to investigate the breakpoint details. If you dismiss or otherwise miss this notification, you may either halt the evaluation process or manually connect an `attach` mode debug session.

## Resources

- [Official VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)

## Forums

- [Extensions / Add-ons Development Forum](https://community.adobe.com/t5/exchange/ct-p/ct-exchange?topics=label-extendscriptdebugger)

## Known Issues

- **The Extension fails to work on Apple devices using Apple Silicon (e.g. M1 processors).** Internally, the extension interfaces with a special library that handles communication with host applications. This library is currently Intel-only. To successfully run the extension on Apple devices running Apple Silicon, VS Code itself must be run with Rosetta. Please see [Apple's documentation](https://support.apple.com/en-us/HT211861) for information on how to configure a universal build of VS Code to run using Rosetta. Alternatively, you can [download](https://code.visualstudio.com/download) the Intel-specific build of VS Code and run it directly.
- **The Extension fails to work on Windows on ARM devices.** Use of the ExtendScript Debugger on Windows on ARM devices is not supported at this time.
- **_Bring Target to Front_ does not work for certain host applications.** Certain host applications on certain operating systems may ignore the extension's request to come forward. A possible workaround is to add `BridgeTalk.bringToFront("host-app-specifier")` to the top of the script you wish to evaluate.
- **The debugger fails to connect to InDesign Server.** The ExtendScript Debugger extension fails to recognize that InDesign Server is running. This is due to a BridgeTalk registration issue in InDesign Server itself. See the [InDesign Server (or When Host Applications Go Rogue)](#indesign-server-or-when-host-applications-go-rogue) section for information on how to work around this issue.
- **The `this` object does not appear in the Variables view.** All ExtendScript engines contain a bug that causes the implicit `this` variable to display incorrect contents when viewed from all but the top stack frame in a given call stack (only the implicit `this` for the top stack frame is ever resolved). For consistency, the implicit `this` variable is **not** listed. If you need to view the contents of the implicit `this` in any context, you may do so by adding `var _this = this;` to your script. The `_this` variable will appear in the Variables view and allow you to inspect the contents of the implicit `this` as expected.
  - This issue also affects the Debug Console. Entering `this` into the Debug Console will only ever refer to the implicit `this` resolved in the context of the top stack frame.
- **Unencoded binary values may break the underlying debugger protocol.** All host applications have a known bug where attempts to send binary-encoded data to the debugger will fail. This typically results in missing Debug Console output or an empty Variables view. Scenarios where you may encounter this issue include when attempting to view the results of a binary file `read()` operation or when writing binary values directly in ExtendScript. The following script, for instance, will trigger this issue:
  ```js
  var x = "\0";             // String representation of "NULL"
  $.writeln("x is: " + x);  // Write the value of `x` to the Debug Console: does nothing
  $.bp();                   // Ask the debugger to break: the Variables view will show an error
  ```
  To work around this issue and "see" the contents of the problematic variable, you may encode it using `encodeURI()`, `toSource()`, or by using a [`btoa()` polyfill](https://developer.mozilla.org/en-US/docs/Web/API/btoa#see_also). For example:
  ```js
  var x = encodeURI("\0");  // Encoded string representation of "NULL"
  $.writeln("x is: " + x);  // Write the value of `x` to the Debug Console: prints "x is: %00"
  $.bp();                   // Ask the debugger to break: the Variables view works as expected
  ```
  Please note that this issue is present in all ExtendScript debuggers, including the original ESTK.

## FAQ

- **Can debug sessions or the `Evaluate Script in Host...` command be configured to launch the host application?**<p>The ExtendScript Debugger extension does not currently support launching host applications.</p>
- **How do I halt evaluation of a script that wasn't started from VS Code?**<p>There are currently two options:
  1. Connect an `attach` mode debug session to the host engine within which the script is evaluating. Once connected use the "Stop" [debug action](https://code.visualstudio.com/docs/editor/debugging#_debug-actions) to simultaneously end the debug session and halt the script. The "Disconnect" button can be converted into a "Stop" button by holding the `Alt`/`option` key.
  1. Attempt to evaluate a script (e.g. with a command or by starting a `launch` mode debug session) in the host engine within which the script is evaluating. The active evaluation will be detected and you will be offered the option to halt the active evaluation process and retry evaluating the script you specified.
</p>

## Terms & Conditions

Your use of this application is governed by the [Adobe General Terms of Use](https://www.adobe.com/go/terms).

© 2022 Adobe. All rights reserved. [Adobe Privacy Policy](https://www.adobe.com/go/privacy_policy).
