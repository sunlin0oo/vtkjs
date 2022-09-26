// import React from 'react'
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';
import vtkShaderProgram from '@kitware/vtk.js/Rendering/OpenGL/ShaderProgram';
import vtkShader from '@kitware/vtk.js/Rendering/OpenGL/Shader';
import vtkShaderCache from '@kitware/vtk.js/Rendering/OpenGL/ShaderCache';
import { render } from '@testing-library/react';
export default function App() {
        //渲染没有问题
    //Standard rendering code setup
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;
    const frag = "void propFuncFS(void){ gl_FragColor = vec4(255,0,0,1);}";
    //创建着色器程序
    const shaderProgram = vtkShaderProgram.newInstance();
    shaderProgram.setContext(renderWindow);
    //创建shader==>顺便设置着色器类型-----------------------
    const vertex = vtkShader.newInstance(
    //   {
    //   shaderType: 'Vertex',
    //   error:'error',
    //   handle:1
    // }
    );
    // ③编译shader
    // vertex.compile();
    console.log('vtkShade方法',vertex);
    // 设置着色器类型
    vertex.setShaderType('Vertex');
    vertex.setSource(frag);
    vertex.setContext(renderWindow);
    console.log('vertexShader', vertex.getShaderType());
    //-----------------------------------------------------------
    console.log('vtkShaderProgram方法',shaderProgram);
    shaderProgram.setVertexShader(vertex);
    // 将着色器添加到容器中
    shaderProgram.attachShader(vertex);
    console.log(shaderProgram.attachShader(vertex));
    // shaderProgram.compileShader();
    // console.log(shaderProgram.compileShader());

    // ②设置源码向shader中导入着色程序
    // vertexShader.setSource('')
    // 获取源码
    // vertexShader.getSource();
    // console.log('vertexShader.getSource()::', vertexShader.getSource())
    // 着色器设置上下文
    // vertexShader.setContext();
    // ④查询shader的状态
    // ⑤连接shader

    // console.log('vtkShaderProgram', shaderProgram.getVertexShader().getShaderType())

    resetCamera();
    render();
}
