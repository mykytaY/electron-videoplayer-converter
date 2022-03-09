window.electronapi.sendFilePath(path =>{
    console.log(path);

    const videoTag = document.querySelector('.js-player');
    videoTag.innerHTML = "";

    const videosrc = document.createElement('source');
    videosrc.src = 'file://' + path;

    videoTag.appendChild(videosrc);

    videoTag.load();
})