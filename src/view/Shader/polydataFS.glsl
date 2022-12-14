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
  Module:    vtkPolyDataFS.glsl

  Copyright (c) Ken Martin, Will Schroeder, Bill Lorensen
  All rights reserved.
  See Copyright.txt or http://www.kitware.com/Copyright.htm for details.

     This software is distributed WITHOUT ANY WARRANTY; without even
     the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR
     PURPOSE.  See the above copyright notice for more information.

=========================================================================*/
// Template for the polydata mappers fragment shader

uniform int PrimitiveIDOffset;

// VC position of this fragment
in vec4 vertexVCVSOutput;

// optional color passed in from the vertex shader, vertexColor
uniform float ambient;
uniform float diffuse;
uniform float specular;
uniform float opacityUniform; // the fragment opacity
uniform vec3 ambientColorUniform;
uniform vec3 diffuseColorUniform;
uniform vec3 specularColorUniform;
uniform float specularPowerUniform;

// optional surface normal declaration
in vec3 normalVCVSOutput;
in vec3 myNormalMCVSOutput;

// extra lighting parameters
//VTK::Light::Dec

// Texture coordinates
//VTK::TCoord::Dec

// picking support
//VTK::Picking::Dec

// Depth Peeling Support
//VTK::DepthPeeling::Dec

// clipping plane vars
//VTK::Clip::Dec

// the output of this shader
layout(location = 0) out vec4 fragOutput0;

// Apple Bug
//VTK::PrimID::Dec

// handle coincident offsets
//VTK::Coincident::Dec

//VTK::ZBuffer::Dec

void main()
{
  // VC position of this fragment. This should not branch/return/discard.
  vec4 vertexVC = vertexVCVSOutput;

  // Place any calls that require uniform flow (e.g. dFdx) here.
  //VTK::UniformFlow::Impl

  // Set gl_FragDepth here (gl_FragCoord.z by default)
  //VTK::Depth::Impl

  // Early depth peeling abort:
  //VTK::DepthPeeling::PreColor

  // Apple Bug
  //VTK::PrimID::Impl

  //VTK::Clip::Impl

  vec3 ambientColor;
  vec3 diffuseColor;
  float opacity;
  vec3 specularColor;
  float specularPower;
  ambientColor = ambientColorUniform;
  diffuseColor = diffuseColorUniform;
  opacity = opacityUniform;
  specularColor = specularColorUniform;
  specularPower = specularPowerUniform;

  // Generate the normal if we are not passed in one
  vec3 normalVCVSOutput = normalize(normalVCVSOutput);
  if (gl_FrontFacing == false) { normalVCVSOutput = -normalVCVSOutput; }
  diff useColor = abs(myNormalMCVSOutput) / diffuse;


  //VTK::TCoord::Impl

  float df = max(0.0, normalVCVSOutput.z);
  float sf = pow(df, specularPower);
  vec3 diffuseL = df * diffuseColor;
  vec3 specularL = sf * specularColor;
  fragOutput0 = vec4(ambientColor * ambient + diffuseL * diffuse + specularL * specular, opacity);
  //VTK::Light::Impl

  if (fragOutput0.a <= 0.0)
    {
    discard;
    }

  //VTK::DepthPeeling::Impl

  //VTK::Picking::Impl

  // handle coincident offsets
  //VTK::Coincident::Impl

  //VTK::ZBuffer::Impl

  //VTK::RenderPassFragmentShader::Impl
}