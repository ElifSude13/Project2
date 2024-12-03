/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */


function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
    var trans1 = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        translationX, translationY, translationZ, 1
    ];
    var rotatXCos = Math.cos(rotationX);
    var rotatXSin = Math.sin(rotationX);
    var rotatYCos = Math.cos(rotationY);
    var rotatYSin = Math.sin(rotationY);

    var rotatx = [
        1, 0, 0, 0,
        0, rotatXCos, -rotatXSin, 0,
        0, rotatXSin, rotatXCos, 0,
        0, 0, 0, 1
    ];

    var rotaty = [
        rotatYCos, 0, -rotatYSin, 0,
        0, 1, 0, 0,
        rotatYSin, 0, rotatYCos, 0,
        0, 0, 0, 1
    ];

    var test1 = MatrixMult(rotaty, rotatx);
    var test2 = MatrixMult(trans1, test1);
    var mvp = MatrixMult(projectionMatrix, test2);

    return mvp;
}


class MeshDrawer {
    constructor() {
        this.prog = InitShaderProgram(meshVS, meshFS);
        this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
        this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');
        this.colorLoc = gl.getUniformLocation(this.prog, 'color');
        this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
        this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');
        this.vertbuffer = gl.createBuffer();
        this.texbuffer = gl.createBuffer();
        this.numTriangles = 0;
        this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
        this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient');
        this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
        this.lightPos = [1.0, 1.0, 1.0];
        this.ambient = 0.5;
        this.enableLightingFlag = false;
        this.specularIntensity = 0.5;
        this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
        this.tex2Loc = gl.getUniformLocation(this.prog, 'tex2');
        this.blendFactorLoc = gl.getUniformLocation(this.prog, 'blendFactor');
    }

    setMesh(vertPos, texCoords, normalCoords) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

        this.numTriangles = vertPos.length / 3;

        this.normalbuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
    }

    draw(trans) {
        gl.useProgram(this.prog);
        gl.uniformMatrix4fv(this.mvpLoc, false, trans);
        updateLightPos();
        this.lightPos = [lightX, lightY, 1.0];

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
        gl.enableVertexAttribArray(this.vertPosLoc);
        gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
        gl.enableVertexAttribArray(this.texCoordLoc);
        gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

        gl.uniform3fv(this.lightPosLoc, this.lightPos);
        gl.uniform1f(this.ambientLoc, this.ambient);
        gl.uniform1f(this.specularIntensityLoc, this.specularIntensity);
        gl.uniform1i(this.enableLightingLoc, this.enableLightingFlag);

        if (this.enableLightingFlag) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.normalbuffer);
            gl.enableVertexAttribArray(gl.getAttribLocation(this.prog, 'normal'));
            gl.vertexAttribPointer(gl.getAttribLocation(this.prog, 'normal'), 3, gl.FLOAT, false, 0, 0);
        }

        gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
    }

    setTexture(img, isSecondTexture = false) {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

        if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }

        gl.useProgram(this.prog);
        if (!isSecondTexture) {
            this.texture1 = texture;
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture1);
            gl.uniform1i(this.texLoc, 0);
        } else {
            this.texture2 = texture;
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.texture2);
            gl.uniform1i(this.tex2Loc, 1);
        }
    }

    showTexture(show) {
        gl.useProgram(this.prog);
        gl.uniform1i(this.showTexLoc, show);
    }

    enableLighting(show) {
        this.enableLightingFlag = show;
    }

    setSpecularLight(intensity) {
        this.specularIntensity = intensity;
    }

    setAmbientLight(ambient) {
        this.ambient = ambient;
    }
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
    dst = dst || new Float32Array(3);
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    if (length > 0.00001) {
        dst[0] = v[0] / length;
        dst[1] = v[1] / length;
        dst[2] = v[2] / length;
    }
    return dst;
}

const meshVS = `
    attribute vec3 pos;
    attribute vec2 texCoord;
    attribute vec3 normal;

    uniform mat4 mvp;

    varying vec2 v_texCoord;
    varying vec3 v_normal;

    void main() {
        v_texCoord = texCoord;
        v_normal = normal;

        gl_Position = mvp * vec4(pos, 1);
    }`;

const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D tex;
    uniform sampler2D tex2;
    uniform float blendFactor;
    uniform vec3 color;
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularIntensity;

    varying vec2 v_texCoord;
    varying vec3 v_normal;

    void main() {
        vec4 texColor1 = texture2D(tex, v_texCoord);
        vec4 texColor2 = texture2D(tex2, v_texCoord);

        vec3 lighting = vec3(1.0);

        if (enableLighting) {
            vec3 normalizedNormal = normalize(v_normal);
            vec3 lightDir = normalize(lightPos);

            float diffuse = max(dot(normalizedNormal, lightDir), 0.0);
            float directionalAmbient = ambient * max(dot(normalizedNormal, lightDir), 0.0);

            vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
            vec3 reflectDir = reflect(-lightDir, normalizedNormal);
            vec3 specular = vec3(0.0);
            if (diffuse > 0.0) {
                float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
                specular = specularIntensity * spec * vec3(1.0, 1.0, 1.0);
            }

            lighting = directionalAmbient + diffuse * color + specular;
        }

        vec4 blendedColor = mix(texColor1, texColor2, blendFactor);
        gl_FragColor = vec4(blendedColor.rgb * lighting, blendedColor.a);
    }`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}

///////////////////////////////////////////////////////////////////////////////////