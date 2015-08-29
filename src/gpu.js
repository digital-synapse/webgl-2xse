﻿
(function () {
    // disable premultiplied alpha and antialias for pixel perfect precision
    var renderer = new THREE.WebGLRenderer({ premultipliedAlpha: false, antialias: false });
    var gl = renderer.context;
    if (!gl) throw ("Requires WebGL rendering context!");
    document.getElementById("WebGLCanvas").appendChild(renderer.domElement);

    var frag2xSE = ajax('shaders/upscale.fragment');
    var fragEdge = ajax('shaders/edge.fragment');
    var vertex = ajax('shaders/upscale.vertex');

    function doDispose(obj) {
        if (obj !== null) {
            for (var i = 0; i < obj.children.length; i++) {
                doDispose(obj.children[i]);
            }
            if (obj.geometry) {
                obj.geometry.dispose();
                obj.geometry = undefined;
            }
            if (obj.material) {
                if (obj.material.materials) {
                    for (i = 0; i < obj.material.materials.length; i++) {
                        obj.material.materials[i].dispose();
                    }
                }
                obj.material.dispose();
                obj.material = undefined;
            }
            if (obj.texture) {
                obj.texture.dispose();
                obj.texture = undefined;
            }
        }
        obj = undefined;
    }

    var renderTargetLinearFloatParams = {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        wrapS: THREE.RenderTargetWrapping,
        wrapT: THREE.RenderTargetWrapping,
        format: THREE.RGBAFormat,
        stencilBuffer: !1,
        depthBuffer: !1
    };
    var materialStage1;
    var materialStage2;
    var materialStage3;
    var w, h;
    var camera;
    var sceneRTT;
    var geometry;
    var textureStage1;
    var textureStage2;
    var mesh;

    window.gpu = {
        init: function (width, height) {

            var scale = 2;
            w = width * scale;
            h = height * scale;
            var w4 = w * scale;
            var h4 = h * scale;
            renderer.setSize(w4, h4);

            camera = new THREE.OrthographicCamera(
                w / -2, w / 2,
                h / 2, h / -2,
                -10000, 10000);
            sceneRTT = new THREE.Scene();
            geometry = new THREE.PlaneBufferGeometry(w, h);


            materialStage1 = new THREE.ShaderMaterial({
                uniforms: {
                    //map: { type: "t", value: texture },
                    invScreenSize: { type: "v2", value: new THREE.Vector2(1 / w, 1 / h) },
                    srcSize: { type: "v2", value: new THREE.Vector2(width, height) },
                    scale: { type: "v2", value: new THREE.Vector2(scale, scale) }
                },
                vertexShader: vertex,
                fragmentShader: frag2xSE,
                blending: 0
            });

            materialStage2 = new THREE.ShaderMaterial({
                uniforms: {
                    //map: { type: "t", value: texture },
                    invScreenSize: { type: "v2", value: new THREE.Vector2(1 / w4, 1 / h4) },
                    srcSize: { type: "v2", value: new THREE.Vector2(w, h) },
                    scale: { type: "v2", value: new THREE.Vector2(scale, scale) }
                },
                vertexShader: vertex,
                fragmentShader: frag2xSE,
                blending: 0
            });

            materialStage3 = new THREE.ShaderMaterial({
                uniforms: {
                    //map: { type: "t", value: textureStage1 },
                    invScreenSize: { type: "v2", value: new THREE.Vector2(1 / w4, 1 / h4) },
                    srcSize: { type: "v2", value: new THREE.Vector2(w, h) },
                    scale: { type: "v2", value: new THREE.Vector2(scale, scale) }
                },
                vertexShader: vertex,
                fragmentShader: fragEdge,
                blending: 0
            });

            mesh = new THREE.Mesh(geometry, materialStage1);
            sceneRTT.add(mesh);
            sceneRTT.add(new THREE.AmbientLight(0xFFFFFF));

            textureStage1 =
                new THREE.WebGLRenderTarget(w, h, renderTargetLinearFloatParams);
            textureStage2 =
                new THREE.WebGLRenderTarget(w4, h4, renderTargetLinearFloatParams);

        },

        resize: function (w, h) {
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        },

        render: function (texture) {

            texture.needsUpdate = true;
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.LinearMipMapLinearFilter;

            materialStage1.uniforms.map = { type: "t", value: texture };
            materialStage1.needsUpdate = true;
            mesh.material = materialStage1;
            mesh.needsUpdate = true;
            renderer.render(sceneRTT, camera, textureStage1, true);

            materialStage2.uniforms.map = { type: "t", value: textureStage1 };
            materialStage2.needsUpdate = true;
            mesh.material = materialStage2;
            mesh.needsUpdate = true;
            renderer.render(sceneRTT, camera, textureStage2, true);

            materialStage3.uniforms.map = { type: "t", value: textureStage2 };
            materialStage3.needsUpdate = true;
            mesh.material = materialStage3;
            mesh.needsUpdate = true;

            renderer.render(sceneRTT, camera);
            texture.dispose();

        }
    };

})();