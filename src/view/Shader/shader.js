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
    // const program = gl.createProgram();
    // console.log('gl::',gl)
    // //渲染没有问题
    // //Standard rendering code setup
    // const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    // const renderer = fullScreenRenderer.getRenderer();
    // // const renderWindow = fullScreenRenderer.getRenderWindow();
    // // const renderWindow = vtkRenderWindow.newInstance();
    // // console.log('renderWindow方法:', renderWindow)
    // const resetCamera = renderer.resetCamera;
    // const render = fullScreenRenderer.getRenderWindow().render;
    // // 会显示model.context.createProgram is not a function
    // // const frag = "attribute vec4 position;\n void main() {\n gl_Position = position;\n }\n";
    // const frag = "attribute vec4 position;\n"+
    // "void main() {\n"+
    // "  gl_Position = position;\n"+
    // "}\n";
    // //创建ShaderProgram着色器程序-----------------------
    // const shaderProgram = vtkShaderProgram.newInstance();
    // console.log('vtkShaderProgram方法',shaderProgram);
    // //-----------------------------------------------------------

    // //创建shader==>设置着色器类型-----------------------这里的步骤均成功
    // const vertex = vtkShader.newInstance();
    // // console.log('vtkShade方法',vertex);

    // // 设置着色器类型==>Vertex
    // vertex.setShaderType('Vertex'); 
    // // console.log('vertexShader', vertex.getShaderType());

    // // 设置源码向shader中导入着色程序
    // vertex.setSource(frag);// false
    // // console.log(vertex.getSource());// 打印frag里面的字符串
    // // let VSSource = vertex.getSource();
    // // VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
    // //   'uniform mat4 MCPCMatrix;',
    // // ]).result;
    // // console.log(VSSource)

    // /** 
    //  * 设置上下文==>
    //  * vtkC++版本 × ==>vtkOpenGLRenderWindow* context==>
    //  * vtkSmartPointer<vtkRenderWindow> renWin = vtkSmartPointer<vtkRenderWindow>::New();
    //  * 另外一种则是WebGL √
    // */

    // // vertex.setContext(renderWindow);
    // vertex.setContext(gl);
    // // console.log('vertex.setContext(gl)', vertex.getContext())
    // // 编译着色器
    // vertex.compile(); // true
    // //-----------------------------------------------------------

    // // 着色器链接上下文==>为所有的着色器都设置上相同的context
    // shaderProgram.setContext(gl);
    // // 将提供的顶点着色器附加到该程序。
    // shaderProgram.attachShader(vertex) // true
    // // shaderProgram.compileShader();

    // // shaderProgram.setVertexShader(vertex); // true

    // // 链接程序
    // shaderProgram.link(vertex);//false
    // // console.log(' shaderProgram.link(vertex)', shaderProgram.link(vertex))
    // // shaderProgram.compileShader();


    // resetCamera();
    // render();
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
                // 然后再需要将其删除掉。deleteShader==>先做vtp渲染，
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
