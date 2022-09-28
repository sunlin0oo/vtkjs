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
    
}
