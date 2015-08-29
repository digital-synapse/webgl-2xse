var texture = THREE.ImageUtils.loadTexture('../assets/smb3.png',THREE.UVMapping, function() {
//var texture = THREE.ImageUtils.loadTexture('../assets/contra.png', THREE.UVMapping, function () {

    gpu.init(256, 240);
    
    // 60 fps
    requestAnimationFrame(function () {
        gpu.render(texture);
    });

});
