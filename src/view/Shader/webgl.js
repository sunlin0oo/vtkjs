/* eslint-disable no-unused-expressions */
// import React from 'react'
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkRenderWindow from '@kitware/vtk.js/Rendering/Core/RenderWindow';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';
// import vtkShaderProgram from '@kitware/vtk.js/Rendering/OpenGL/ShaderProgram';
// import vtkShader from '@kitware/vtk.js/Rendering/OpenGL/Shader';
// import vtkShaderCache from '@kitware/vtk.js/Rendering/OpenGL/ShaderCache';
import vtkShaderProgram from './ShaderProgram/ShaderProgram';
import vtkShader from './Shader/Shader';
import vtkShaderCache from './ShaderCache/ShaderCache';
import { render } from '@testing-library/react';
export default function App() {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    var VSHADER_SOURCE =
            'void main() {\n' +
            '  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // Set the vertex coordinates of the point
            '  gl_PointSize = 10.0; return;\n' +                    // Set the point size
            '}\n';

        // Fragment shader program
        console.log(VSHADER_SOURCE, 'VSHADER_SOURCE')
        var FSHADER_SOURCE =
            'void main() {\n' +
            '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); return;\n' + // Set the point color
            '}\n';
        // const FSHADER_SOURCE = `
        //     void main() {
        //         gl_FragColor = vec4(1, 0, 0, 1)
        //     }
        // `
        // const d = `void main() {
        //     gl_Position = vec4(0, 0, 0, 1);
        //     gl_PointSize = 10;return;}`
        // console.log(d, 'd3333')
        function loadShader(gl, type, source) {
            const shader = gl.createShader(type); // 
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
            if (!compiled) {
                // 当编译失败了，我们就需要查看失败的原因。getShaderInfoLog
                // 以及将其删除掉。
                const err = gl.getShaderInfoLog(shader);
                console.log(`编译失败的原因时:${err}`)
                // 然后再需要将其删除掉。deleteShader==>
                gl.deleteShader(shader); // 删除着色器
                return null;
            }
            return shader;
        }
        
        function createProgram(gl, vshader, fshader) {
            const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vshader)
            const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fshader);
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            console.log(program, 'program');
            gl.linkProgram(program);
            var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
            console.log(linked, 'linkedlinked');
            if (!linked) {
                var error = gl.getProgramInfoLog(program);
                console.log('Failed to link program: ' + error);
                gl.deleteProgram(program);
                gl.deleteShader(fragmentShader);
                gl.deleteShader(vertexShader);
                return null;
            }
            gl.useProgram(program)
            console.log('sdf')
            // return program
        }
        createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE)
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, 1);
        // console.log(gl.VERTEX_SHADER, 'gl')
}
