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
    const program = gl.createProgram();
    console.log('gl::',gl)
    //渲染没有问题
    //Standard rendering code setup
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    // const renderWindow = fullScreenRenderer.getRenderWindow();
    // const renderWindow = vtkRenderWindow.newInstance();
    // console.log('renderWindow方法:', renderWindow)
    const resetCamera = renderer.resetCamera;
    const render = fullScreenRenderer.getRenderWindow().render;
    // 会显示model.context.createProgram is not a function
    // const frag = "attribute vec4 position;\n void main() {\n gl_Position = position;\n }\n";
    const frag = "attribute vec4 position;\n"+
    "void main() {\n"+
    "  gl_Position = position;\n"+
    "}\n";
    //创建ShaderProgram着色器程序-----------------------
    const shaderProgram = vtkShaderProgram.newInstance();
    console.log('vtkShaderProgram方法',shaderProgram);
    //-----------------------------------------------------------

    //创建shader==>设置着色器类型-----------------------这里的步骤均成功
    const vertex = vtkShader.newInstance();
    // console.log('vtkShade方法',vertex);

    // 设置着色器类型==>Vertex
    vertex.setShaderType('Vertex'); 
    // console.log('vertexShader', vertex.getShaderType());

    // 设置源码向shader中导入着色程序
    vertex.setSource(frag);// false
    // console.log(vertex.getSource());// 打印frag里面的字符串
    // let VSSource = vertex.getSource();
    // VSSource = vtkShaderProgram.substitute(VSSource, '//VTK::Camera::Dec', [
    //   'uniform mat4 MCPCMatrix;',
    // ]).result;
    // console.log(VSSource)

    /** 
     * 设置上下文==>
     * vtkC++版本 × ==>vtkOpenGLRenderWindow* context==>
     * vtkSmartPointer<vtkRenderWindow> renWin = vtkSmartPointer<vtkRenderWindow>::New();
     * 另外一种则是WebGL √
    */

    // vertex.setContext(renderWindow);
    vertex.setContext(gl);
    // console.log('vertex.setContext(gl)', vertex.getContext())
    // 编译着色器
    vertex.compile(); // true
    //-----------------------------------------------------------

    // 着色器链接上下文==>为所有的着色器都设置上相同的context
    shaderProgram.setContext(gl);
    // 将提供的顶点着色器附加到该程序。
    shaderProgram.attachShader(vertex) // true
    // shaderProgram.compileShader();

    // shaderProgram.setVertexShader(vertex); // true

    // 链接程序
    shaderProgram.link(vertex);//false
    // console.log(' shaderProgram.link(vertex)', shaderProgram.link(vertex))
    // shaderProgram.compileShader();


    // resetCamera();
    // render();
}
