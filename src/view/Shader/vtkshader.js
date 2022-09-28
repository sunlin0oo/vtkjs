/* eslint-disable no-unused-expressions */
// import React from 'react'
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkOpenGLRenderWindow from '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import vtkOpenGLPolyDataMapper from '@kitware/vtk.js/Rendering/OpenGL/PolyDataMapper.js';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';
// import vtkShaderProgram from '@kitware/vtk.js/Rendering/OpenGL/ShaderProgram';
// import vtkShader from '@kitware/vtk.js/Rendering/OpenGL/Shader';
// import vtkShaderCache from '@kitware/vtk.js/Rendering/OpenGL/ShaderCache';
import vtkShaderProgram from './ShaderProgram/ShaderProgram';
import vtkShader from './Shader/Shader';
import vtkShaderCache from './ShaderCache/ShaderCache';
// import { render } from '@testing-library/react';
export default function App() {
    //渲染没有问题
    //Standard rendering code setup
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;
    //-----------------------------------------------------------

    const openGLPolyDataMapper = vtkOpenGLPolyDataMapper.newInstance();
    console.log('vtkOpenGLPolyDataMapper::',openGLPolyDataMapper)
    // 通过openGLRenderWindow设置WebGLRenderingContext
    const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance({
        context:WebGLRenderingContext
    });
    // console.log('openGLRenderWindow:', openGLRenderWindow.get3DContext())

    var VSHADER_SOURCE =
    'void main() {\n' +
    '  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // Set the vertex coordinates of the point
    '  gl_PointSize = 10.0; return;\n' +                    // Set the point size
    '}\n';

    var frag =
    'varying vec3 n'+
    'varying vec3 l;'+
    'void propFuncFS( void )'+
    '{vec3 cl = vec3(.2,0,.5);vec3 light = normalize(l.xyz);float vdn = light.z;'+
        'cl = round(vdn * 5) / 5 * cl;gl_FragColor = vec4(cl*vdn,1);'+
        'if (vdn < 0.3)'+
        '{gl_FragColor = vec4(vec3(0),1);}'+
    '}'

    // const mapperSpecificProp = openGLPolyDataMapper.getViewSpecificProperties();
    // mapperSpecificProp['OpenGL'] = {
    // ShaderReplacements: [],
    // VertexShaderCode: VSHADER_SOURCE,
    // FragmentShaderCode: frag,
    // GeometryShaderCode: ''
    // };

    //创建ShaderCache着色器程序-----------------------
    const shaderCache = vtkShaderCache.newInstance();
    // console.log('shaderCache方法::', shaderCache);
    
    //-----------------------------------------------------------

    //创建shader==>设置着色器类型
    const shadervertex = vtkShader.newInstance();
    console.log('vtkShade方法',shadervertex);
    // 设置着色器类型==>Vertex
    shadervertex.setShaderType('Vertex'); 
    // console.log('vertexShader', shadervertex.getShaderType());
    // 设置源码向shader中导入着色程序
    shadervertex.setSource(VSHADER_SOURCE);// false
    // console.log(shadervertex.getSource());// 打印frag里面的字符串
    /** 
     * 设置上下文==>
     * vtkC++版本 × ==>vtkOpenGLRenderWindow* context==>
     * vtkSmartPointer<vtkRenderWindow> renWin = vtkSmartPointer<vtkRenderWindow>::New();
     * 另外一种则是WebGL √
    */
    // WebGL2RenderingContext
    shadervertex.setContext(openGLRenderWindow.get3DContext());
    // console.log('vertex.setContext', shadervertex.getContext())
    // 编译着色器
    shadervertex.compile(); // true
    // console.log('shadervertex.compile()', shadervertex.compile()

    //-----------------------------------------------------------

    //创建ShaderProgram着色器程序-----------------------
    const shaderProgram = vtkShaderProgram.newInstance();
    console.log('vtkShaderProgram方法::',shaderProgram);
       
    // 着色器链接上下文==>为所有的着色器都设置上相同的context
    shaderProgram.setContext(openGLRenderWindow.get3DContext());
    // console.log('vtkShaderProgram方法::',shaderProgram.getContext());
    // 将提供的顶点着色器附加到该程序。
    shaderProgram.attachShader(shadervertex) // true以上步骤均成功
    // shaderProgram.compileShader() 
    // 链接程序
    shaderProgram.link();//false==>glLinkProgram(programObject);
    console.log(shaderProgram.link())
    // 绑定program
    // shaderProgram.bind();


    resetCamera();
    render();
}
