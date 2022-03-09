const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electronapi',
{
    sendFilePath: function(func){
        ipcRenderer.on('filepath', (event, fileData) => func(fileData));
    }
})