# Changelog
All notable changes to the "extendscript-debug" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

## 2.0.0 - 2022-06-07
### Added:
- Documentation notes about how the extension handles ExtendScript preprocessor directives (they are ignored).
- Documentation notes for migrating from v1.y.z versions of the extension.
- Documentation notes for basic use cases.
- Launch configuration property deprecation support for v1.y.z properties.
  - Deprecated properties will be decorated as warnings with tooltips suggesting the updated property name.
  - Non-deprecated v1.y.z properties are considered obsolete. These will also be decorated as warnings, though the tooltip will explain that the property is not allowed.
- Automatically show the break state when an `attach` debug session initiates a connection to a host engine that is already stopped at a breakpoint. (_This should only happen in rare circumstances. See the "General Notes" section of the README for more._)
- Show a notification with an option to "Attach Debug Session" when a scripted breakpoint (e.g. `debugger` or `$.bp()`) causes the host engine to break while no debug session is active. (_This should only happen in rare circumstances. See the "General Notes" section of the README for more._)
- Show a notification that provides guidance when attempting to activate the extension on an unsupported platform.

### Changed:
- Skip showing the Eval Process picker when a Halt command is issued and only a single Eval Process is active.
- The `Evaluate Script in Host...` command's `filePath` argument is now `script` which better aligns the command arguments and debug launch configuration properties.

### Fixed:
- A race condition that occurs when restarting a debug session that could result in a confusing error about a pre-existing debug session for the target host.
- Show a helpful message instead of an empty host application picker when the extension cannot find any installed host applications.
- Documentation of default values for some properties.
- Internal documentation links.
- Breakpoints configured in VS Code not triggering as expected in `launch` debug sessions.
- Breakpoints configured in VS Code triggering in a script after the debug session has been disconnected, leaving the ExtendScript engine in a "hung" state.

## 2.0.0-rc1 - 2022-04-18
### Added:
- Improved safety of internal debug protocol logic, making the extension more robust in the face of unexpected input.
- Documentation notes about running on Apple Silicon devices.
- Known Issue documentation for the lack of `this` object in the Variables view.
- Known Issue documentation for issues debugging variables that contain binary data.
- Detect when a script evaluation fails because the target engine is already busy evaluating another script. Offer to ignore or to halt the running evaluation process and start the requested evaluation.
- Command to `Evaluate Script in Attached Host...` that will evaluate the focused script in an host engine to which a debug session is attached. If no such sessions exist, it will attempt to start one. If more than one such session exists, it will offer a selection from which to choose.

### Changed:
- The "Run and Debug" button (triggers a Zero Configuration debug session) now offers to start a Launch or Attach mode session.
- Halting a script now swallows the "Execution halted" error as showing it was redundant.
- Zero Configuration Debug Sessions now have more descriptive names.

### Fixed:
- Fixed host communication when scripts/messages contain XML `<![CDATA[]]>` sections in them.

## 2.0.0beta3 - 2022-03-16
### Added:
- Status Bar button to _Eval in Adobe..._. This button provides easy access to the `Evaluate Script in Host...` command. It appears for files recognized as `javascript`, `javascriptreact`, or `extendscript`, or files with extension `.jsxbin`.
- The `Evaluate Script in Host...` command can now be accessed from Text Editor context menus.
- Command to `Halt Script in Host...` that will stop an active evaluation process.
- Command to `Clear Error Highlights...` that will clear any active error highlights.
- Status Bar button to _Halt in Adobe..._. This button provides easy access to the `Halt Script in Host...` command.
- Support `launch` request debug configurations. These configurations differ from the existing `attach` request debug configurations in that starting a `launch` request debug configuration will also cause a script (either specified with a new `script` configuration property or, if no `script` configuration property is set, the focused document) to be evaluated in the target host application engine. These debug sessions automatically end when the script itself ends. Stopping the debug session will also stop the script evaluation.
- Support for distinct "Stop" and "Disconnect" buttons in the [Debug toolbar](https://code.visualstudio.com/docs/editor/debugging#_debug-actions) for both `attach` and `launch` request debug sessions. Pressing "Stop" will cause an evaluating script to halt as the debug session stops. Pressing "Disconnect" will leave an evaluating script alone as the debug session stops. By default `launch` request debug configurations show the "Stop" button and `attach` request debug configurations show the "Disconnect" button. Hold the `Alt`/`option` key to toggle between the two.
- A new configuration property/command argument (`registeredSpecifier`) to support InDesign Server (and any other similarly misbehaving application). See the README for details.
- A new setting (_Application Specifier Overrides_) to support InDesign Server (and any other similarly misbehaving application). See the README for details. The setting can be found in VSCode Settings as "Application Specifier Overrides" under "Extensions > ExtendScript > Advanced" and has the key `extendscript.advanced.applicationSpecifierOverrides`. Default is `[]`.
- A new setting (_Highlight Error Lines_) to control whether or not to highlight the line indicated when evaluation errors are encountered. The setting can be found in VSCode Settings as "Highlight Error Lines" under "Extensions > ExtendScript > Script Evaluation" and has the key `extendscript.scriptEvaluation.highlightErrorLines`. Default is `true`.

### Changed:
- Removed the _Evaluating..._ Status Bar item when an evaluation process is active. This has been replaced with the _Halt in Adobe..._ button.
- Attempts to evaluate a script in a host engine while an evaluation is already in progress will now cause an alert.
- Result/Error messages from script evaluation now include their source host application and engine.
- Starting a script evaluation or a debug session will clear now any existing error highlights.

### Fixed:
- An issue where a host application being debugged crashes, is reopened, and a new debug fails to connect with an error until the VS Code window was reloaded.

## 2.0.0beta2 - 2022-02-14
### Added:
- Support "home"-relative paths (those starting with `~`) for configuration options (e.g. `aliasPath`).
- Highlight the source code line associated with the error when an "Evaluate Script in Host..." command reports a runtime error.
- The extension can now tell a target host application to come forward when the "Evaluate Script in Host..." command is executed. The setting can be found in VSCode Settings as "Bring Target Application To Front" under "Extensions > ExtendScript > Script Evaluation" and has the key `extendscript.scriptEvaluation.bringTargetApplicationToFront`. Default is `false`.
  - This can also be configured with Custom Key Bindings using the `bringToFront` boolean argument (see the README for details).
- Script Evaluation information is now output to the extension's Output Channel. This includes a message when an evaluation begins and the result/error of an evaluation.
- Output of Script Evaluation results/errors to VSCode Message Boxes is now configurable. The setting can be found in VSCode Settings as "Show Result Messages" under "Extensions > ExtendScript > Script Evaluation" and has the key `extendscript.scriptEvaluation.showResultMessages`. Default is `true`.
- Lots of messages are now routed to the extension's Output Channel. This includes Debug Session lifetime messages, script evaluation process messages, and lots of warnings and errors that may occur.

### Changed:
- The extension now reports its debugger as "ExtendScript" instead of "ExtendScript Debug". The `type` value used in `launch.json` and command strings remains unchanged.
- The extension's Output Channel has been renamed from "ESDebugger" to "ExtendScript".
- The "Caught Exceptions" breakpoint description is now more precise about its limitations. Specifically, changes to the setting at runtime will only apply to scopes created _after_ the setting is changed.

### Fixed:
- Improved handling of evaluation requests in certain edge cases (e.g. empty script with no backing file).
- No longer allow sending the contents of the VSCode Output window (or similar) to a host for evaluation when it has focus.
- Severe slowdown and possible crash when very large variables (e.g. string of size 10MB) are viewed in the Variables view during a debug session. Fixes [ESDVSC-7].

## 2.0.0beta1 - 2021-12-17
### Added:
- Setting to break on "Caught Exceptions". Changes to this setting during active script evaluation (e.g. while stopped at a breakpoint) do **not** apply to pre-existing scopes (stack frames).

### Changed:
- Attempts to evaluate a script in a host while an evaluation is already in progress will be ignored.

### Fixed:
- Fix incorrect exception messaging and file status in the Call Stack on Windows.
- Fix `exportToJSXBin.js` command line utility doesn't work on macOS [ESDVSC-5].
- Fix setting `debugLevel: 0` for custom `evalInHost` command key bindings still triggering breakpoints.

## 2.0.0beta0.5 - 2021-12-10
### Added:
- Support for Windows.
- Engine name now shown in "Eval in..." command.

### Fixed:
- Support files reported by host "numerical file id" so that they can be viewed while debugging.
- Do not "ignore errors" when issuing debug commands with the debugger.

## 2.0.0beta0 - 2021-11-16
### Changed:
- The entire extension was re-written from the ground up. Currently supported features include:
  - Breakpoints
    - Conditional Breakpoints
      - Expression Condition
      - Hit Count
    - Exception Breakpoints
      - Caught Exceptions
  - Logpoints
  - Call Stack View
  - Variables View
    - Local and Global Scope
    - Modify variables
  - Debug Actions
    - Continue / Pause
    - Step Over
    - Step Into
    - Step Out
    - Restart
    - Disconnect / Stop
  - Debug Console
    - Expression Evaluation
  - Expression Evaluation of Code on Hover While Debugging
  - Export ExtendScript to JSXBIN
- Please see the README for more details.
- Minimum Visual Studio Code version required to run the extension is now **1.62.0**.
- This release is only compatible with macOS.

## 1.1.2 - 2019-07-11
### Fixed:
- The extension breaks on Windows OS because of major electron and node version changes in Visual Studio Code Release __1.36.0__.
- Can't run debugger with Adobe Bridge. 

### Changed:
- Minimum Visual Studio Code version required to run the extension is now __1.36.0__.

## 1.1.1 - 2019-05-31
### Fixed:
- Syntax error highlighting doesn't support "#includepath".
- Extension doesn't highlight the lines having syntax error if there are Unicode characters in script path.

## 1.1.0 - 2019-05-22
### Added:
- Added support for syntax error highlighting. The script will be checked for syntax errors before starting an extendscript debug session.
The syntax error will be shown in output channel as well as the line containing syntax error will be highlighted in editor. The highlight color is configurable through `syntaxErrorHighlightColor' launch configuration.
- The color of `Select Target Application` in status bar is now configurable through `selectTargetColor` launch configuration.
- The color of `Connected Target Application` in status bar is now configurable through `connectedTargetColor` launch configuration.
- Now the extension will not be activated with VSCode start. It will be activated if there is an opened js(x) file or while starting a debug   session directly(launch configuration should have `targetSpecifier` and some script path). Please note that after the extension is           activated, it won't be deactivated until VSCode is restarted.
- Now `engineName` is not required in launch configuration file. Only having `targetSpecifier` is enough. The debug session will be started    in default engine i.e. `main`.
- Added support for #target and #targetengine directives.
- Added support for extension mode through launch configuration `extensionMode`. There are 2 modes in which extension can run.
  1. `active` mode: The extension will work as it was working before.
  2. `passive` mode: The core library on which the extension depends, will be initialized on demand and destroyed when not in use. BridgeTalk instance will be freed. As a result, multiple VSCode instances can be used. But please note that only one debug session can run at one time. Also VSCode needs to be restarted everytime `extensionMode` is changed. In `passive` mode, debugging session can only be started from within VSCode, targets cannot initialize a debug session.

## 1.0.1 - 2019-04-12
### Added:
- Support for continuing execution after clearing runtime error. Clear Runtime Error dialog will be shown. If you don't want the dialog everytime, you can set the default behaviour using `clearRuntimeError` launch configuration. Set `true` to always continue execution clearing runtime error, `false` otherwise.
- Show OS save dialog for Export to JSXBIN.

### Fixed:
- Fixed issues when running in Visual Studio Code 1.33.0. For example, scripts may run only once for certain configurations.
- Fixed the case where ExtendScript Toolkit opened when $.writeln was used more than 500 times in a loop.
- Fixed a race condition, which sometimes left the extension in an inconsistent state.

## 1.0.0 - 2019-02-20
### Added:
Initial release with following features:
- Target and Engine Information Bar - Developers can launch ExtendScript-enabled Adobe applications and select ExtendScript engine
- Call Stack
- Breakpoints
	- Hit counts
	- Expressions
	- debugger statement
- Variables Inspection
	- Local Scope and Global Scope
	- Modify variables
- Debugging commands
	- Continue
	- Stepin
	- Stepover
	- Stepout
	- Stop
	- Restart
- Debug Console
	- Expression evaluation
- Expression Evaluation on Hover
- Export ExtendScript to JSXBIN
- Target started debug session
