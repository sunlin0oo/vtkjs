#version 300 es
#define attribute in
#define textureCube texture
#define texture2D texture
#define textureCubeLod textureLod
#define texture2DLod textureLod

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
precision highp int;
#else
precision mediump float;
precision mediump int;
#endif

/*=========================================================================

  Program:   Visualization Toolkit
  Module:    vtkPolyDataVS.glsl

  Copyright (c) Ken Martin, Will Schroeder, Bill Lorensen
  All rights reserved.
  See Copyright.txt or http://www.kitware.com/Copyright.htm for details.

     This software is distributed WITHOUT ANY WARRANTY; without even
     the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
     PURPOSE.  See the above copyright notice for more information.


  * MC  - Model Coordinates==>本地坐标
  * WC  - WC World Coordinates==>世界坐标
  * VC  - View Coordinates==>观察者坐标
  * DC  - Display Coordinates==>展示坐标
  * NVC - NormalizedViewCoordinates

=========================================================================*/

attribute vec4 vertexMC;
// 模型中顶点位置
// frag position in VC
out vec4 vertexVCVSOutput;
uniform float pointSize;

// optional normal declaration
attribute vec3 normalMC;
uniform mat3 normalMatrix;
out vec3 normalVCVSOutput;
out vec3 myNormalMCVSOutput;

// extra lighting parameters
//VTK::Light::Dec

// Texture coordinates
//VTK::TCoord::Dec

// material property values
//VTK::Color::Dec

// clipping plane vars
//VTK::Clip::Dec

// camera and actor matrix values
uniform mat4 MCDCMatrix;
uniform mat4 MCVCMatrix;//MCDCMatrix means ModelCoordinates to View Coordinates matrix. === gl_ModelViewMatrix 

// Apple Bug
//VTK::PrimID::Dec

// picking support
//VTK::Picking::Dec

void main()
{
  //VTK::Color::Impl

  normalVCVSOutput = normalMatrix * normalMC;
  myNormalMCVSOutput = normalMC;


  //VTK::TCoord::Impl

  //VTK::Clip::Impl

  //VTK::PrimID::Impl

  vertexVCVSOutput = MCVCMatrix * vertexMC;
  gl_Position = MCPCMatrix * vertexMC;
  gl_PointSize = pointSize;

  //VTK::Light::Impl

  //VTK::Picking::Impl
}