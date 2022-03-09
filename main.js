const { app, BrowserWindow, Menu, dialog } = require('electron');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static-electron');
const ffprobeStatic = require('ffprobe-static-electron');
const ProgressBar = require('electron-progressbar');
ffmpeg.setFfmpegPath(ffmpegStatic.path);
ffmpeg.setFfprobePath(ffprobeStatic.path);

let loadFile = null;

const isMac = process.platform === 'darwin';
let window = null;

app.on('ready', () => {
    window = new BrowserWindow({
        width: 1000,
        height: 605,
        resizable: false,
        webPreferences: {
            preload: `${__dirname}/preload.js`
        }
    });
    window.loadFile('index.html');
})

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            {
                label: 'Video',
                submenu: [
                    {
                        label: 'Load...',
                        click() {
                            dialog.showOpenDialog(window, {
                                properties: ['openFile'],
                                filters: [{
                                    name: 'Video', extensions: ['mp4', 'mpg', 'mpeg', 'mov', 'wmv', 'flv', 'avi', 'webm', 'rm', 'ram', 'swf', 'ogg']
                                }]
                            })
                                .then((result) => {
                                    result.filePaths.forEach(path => {
                                        console.log('Main: ' + path)
                                        loadFile = path;
                                        window.webContents.send('filepath', path);
                                        enableMenu1.enabled = true;
                                        enableMenu2.enabled = true;
                                        enableMenu3.enabled = true;
                                    })
                                })
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Convert to AVI...',
                        id: 'avi',
                        click() {
                            convert('avi')
                        },
                        enabled: false
                    },
                    {
                        label: 'Convert to MP4...',
                        id: 'mp4',
                        click() {
                            convert('mp4')
                        },
                        enabled: false
                    },
                    {
                        label: 'Convert to WEBM...',
                        id: 'webm',
                        click() {
                            convert('webm')
                        },
                        enabled: false
                    }
                ]
            },
            { type: 'separator' },
            {
                label: 'Quit',
                accelerator: 'CmdOrCtrl+Q',
                click() {
                    app.quit();
                }
            }
        ]
    },
    {
        label: 'Developer',
        submenu: [
            {
                role: 'toggleDevTools'
            }
        ]
    }
]

if (isMac) {
    menuTemplate.unshift({ label: 'empty' });
}

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

const enableMenu1 = menu.getMenuItemById('avi');
const enableMenu2 = menu.getMenuItemById('mp4');
const enableMenu3 = menu.getMenuItemById('webm');

function convert(ext){
    dialog.showSaveDialog(window, {
        properties: ['createDirectory'],
        filters: [{
            name: 'Video', extensions: [ext]
        }]
    })
        .then((result) => {
            if (!result.canceled) {
                let progressBar = new ProgressBar({
                    indeterminate: false,
                    text: 'Preparing data...',
                    detail: 'Wait...'
                });
                let savedPath = result.filePath;
                ffmpeg(loadFile)
                    .withOutputFormat(ext)
                    //.on("progress", ffmpegOnProgress(logProgress, durationEstimate))
                    .on("end", function (stdout, stderr) {
                        console.log("Finished");
                        progressBar.close();
                        dialog.showMessageBox({
                            message: "Video conversion completed",
                            type: "info"
                        })
                    })
                    .on("progress", function (stdout, stderr) {
                        console.log(stdout);
                        if (!progressBar.isCompleted()) {
                            progressBar.value = Math.round(stdout.percent);
                        }
                        progressBar
                            .on('completed', function () {
                            })
                            .on('aborted', function (value) {
                                console.info(`aborted... ${value}`);
                            })
                            .on('progress', function (value) {
                                progressBar.detail = `${value}% completed`;
                            });
                    })
                    .on("error", function (err) {
                        console.log("an error happened: " + err.message);
                    })
                    .saveToFile(savedPath);
            }
        })
}