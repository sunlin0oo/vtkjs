// import React from 'react'
import '@kitware/vtk.js/favicon';
import jsondata from './JSON/3M-10268-6212PC.json';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkTriangle from '@kitware/vtk.js/Common/DataModel/Triangle';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction'
import vtkColorMaps from './components/ColorTransferFunction/ColorMaps/index';
import vtkColorMap from'@kitware/vtk.js/Rendering/Core/ColorTransferFunction/ColorMaps'
import vtkShaderProgram from '@kitware/vtk.js/Rendering/OpenGL/ShaderProgram.js';
import vtkShader from '@kitware/vtk.js/Rendering/OpenGL/Shader';

// 引入颜色模式，标量模式
import {
  ColorMode,
  ScalarMode
} from '@kitware/vtk.js/Rendering/Core/Mapper/Constants';
// import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
export default function App() {
    //渲染没有问题
    //Standard rendering code setup
     const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
     const renderer = fullScreenRenderer.getRenderer();
     const renderWindow = fullScreenRenderer.getRenderWindow();
     const resetCamera = renderer.resetCamera;
     const render = renderWindow.render;

    if (!jsondata) {
      return;
    } 
    // json数据导入Polydata中
    // 获取到面总数量
    let faceLength = jsondata.face_list.length;
    
    //获取到三角面总数量
    let numTriangles = 0; //numTriangles === nbFaces
    let numdimesion = 0;
    for(let i=0;i<faceLength;i++){
      numTriangles += jsondata.face_list[i].number_of_triangles;
      numdimesion += jsondata.face_list[i].vertex_coord.length;
    }
    // console.log("numTriangles",numTriangles);

    // 记录三角形的个数==>用于存储数组位数
    let allTriIndex = 0;
    // 存储顶点维度
    var pointValues = new Float32Array(numdimesion);
    // 存储法向量
    var normalValues = new Float32Array(numTriangles * 3);
    // 存储Cell 对应C++中trangles
    var cellValues = new Uint32Array(numTriangles * 4);
    var cellDataValues = new Uint16Array(numTriangles);
    var cellOffset = 0;
    // 记录之前所有面的顶点数量
    let last_vertex_coord = 0;
    // 记录当前顶点维度的位置
    let pointValuesIndex = 0
    //读取数据
    for (var faceIdx = 0; faceIdx < faceLength; faceIdx++) {
      // 创建polydata数据集合
      var polydata = vtkPolyData.newInstance();
      // 记录每个面所含有的三角形
      let triOfFaceLength = jsondata.face_list[faceIdx].number_of_triangles
      // points.setNumberOfPoints(triOfFaceLength*3);
      let vertexLength = jsondata.face_list[faceIdx].vertex_coord.length;
      for(let i = 0;i<vertexLength;i++){
        pointValues[pointValuesIndex] = (jsondata.face_list[faceIdx].vertex_coord[i]);
        pointValuesIndex++;
      };
      for(let triIndex =0;triIndex < triOfFaceLength;triIndex++){
        //  获取三角形顶点0, 1, 2
        let tri_vertex_index_0 = jsondata.face_list[faceIdx].tri_vertex_index[0 + (triIndex * 3)];
        let tri_vertex_index_1 = jsondata.face_list[faceIdx].tri_vertex_index[1 + (triIndex * 3)];
        let tri_vertex_index_2 = jsondata.face_list[faceIdx].tri_vertex_index[2 + (triIndex * 3)];
        // 计算三角面的面法向量
        let normalValue = getNormal(jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_0)*3 + 0 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_0)*3 + 1 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_0)*3 + 2 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_1)*3 + 0 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_1)*3 + 1 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_1)*3 + 2 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_2)*3 + 0 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_2)*3 + 1 ],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_2)*3 + 2 ]);
        normalValues[allTriIndex * 3 + 0] = normalValue[0];
        normalValues[allTriIndex * 3 + 1] = normalValue[1];
        normalValues[allTriIndex * 3 + 2] = normalValue[2];
        // 3表示一个单元包含的点的个数，id?表示单元所关联的点的Id
        cellValues[cellOffset++] = 3;
        cellValues[cellOffset++] =  last_vertex_coord + jsondata.face_list[faceIdx].tri_vertex_index[(triIndex*3)+0];
        cellValues[cellOffset++] =  last_vertex_coord + jsondata.face_list[faceIdx].tri_vertex_index[(triIndex*3)+1];
        cellValues[cellOffset++] =  last_vertex_coord + jsondata.face_list[faceIdx].tri_vertex_index[(triIndex*3)+2];
        cellDataValues[allTriIndex] = 0;
        allTriIndex++;
      }
      last_vertex_coord += jsondata.face_list[faceIdx].vertex_coord.length/3;
    }
    console.log("polydata::",polydata);
    
    // Rotate points
    console.log("JOSN-numTriangles:::",numTriangles);
    console.log("JOSN-pointValues:::",pointValues);
    console.log("JOSN-normalValues:::",normalValues);
    console.log("JOSN-cellValues:::",cellValues);
    console.log("JOSN-cellDataValues:::",cellDataValues);

    // 这样可以将数据进行导入
    // 将顶点数组全部导入，3个为一组，作为几何结构
    polydata.getPoints().setData(pointValues, 3);
    //将Cell输入导入到CellArray中作为拓扑结构
    polydata.getPolys().setData(cellValues);
    // polydata.getLines().setData(cellValues);
    // polydata.getVerts().setData(cellValues);

    polydata.getCellData().setNormals(vtkDataArray.newInstance({
      name: 'Normals',
      values: normalValues,
      numberOfComponents: 3
    })); // Add new output

    // 创建角色
    const actor = vtkActor.newInstance();

    // const mapper = vtkMapper.newInstance();
    const mapper = vtkMapper.newInstance();
    // Mapper==>存放数据和渲染信息==>将输入数据转换为几何图元进行渲染
    // 映射连接计算器
    mapper.setInputData(polydata); 
    actor.setMapper(mapper);
    const mapperViewProp = mapper.getViewSpecificProperties();
    
    mapperViewProp.OpenGL = {
      ShaderReplacements: [],
    };
    console.log('mapperViewProp.OpenGL::', mapperViewProp.OpenGL);
    mapperViewProp.addShaderReplacements = (
      _shaderType,//需要编辑的shader类型
      _originalValue,//要替换的值
      _replaceFirst,//true:在默认值之前完成替换，false==>反之之后完成替换
      _replacementValue,//替换值
      _replaceAll// true:定义只需要替换第一次出现,false:全部替换
    ) => {
      mapperViewProp.OpenGL.ShaderReplacements.push({
        shaderType: _shaderType,
        originalValue: _originalValue,
        replaceFirst: _replaceFirst,
        replacementValue: _replacementValue,
        replaceAll: _replaceAll,
      });
    };

    mapperViewProp.addShaderReplacements(
      'Vertex',
      '//VTK::Normal::Dec', //declaration any uniforms/varying needed for normals   声明法线所需要的uniforms/varying==>定义用这个
      true,
      '//VTK::Normal::Dec\n  varying vec3 myNormalMCVSOutput;\n',  // 标准模型坐标
      false
  );

  mapperViewProp.addShaderReplacements(
      'Vertex',
      '//VTK::Normal::Impl',// Implementation of shader code for handling normals  用于处理法线着色器的实现==>调用变量用这个
      true,
      '//VTK::Normal::Impl\n  myNormalMCVSOutput = normalMC;\n',
      false
  );
  mapperViewProp.addShaderReplacements(
      'Vertex',
      '//VTK::Normal::Impl',// Implementation of shader code for handling normals  用于处理法线着色器的实现==>调用变量用这个
      true,
      '//VTK::Normal::Impl\n  myNormalMCVSOutput = normalMC;\n',
      false
  );
  // All fragment shaders should name their inputs with a postfix of VSOutput.
  mapperViewProp.addShaderReplacements(
      'Fragment',
      '//VTK::Normal::Dec',
      true,
      '//VTK::Normal::Dec\n  varying vec3 myNormalMCVSOutput;\n',
      false
  );

  mapperViewProp.addShaderReplacements(
      'Fragment',
      '//VTK::Normal::Impl',
      true,
      '//VTK::Normal::Impl\n  diffuseColor = abs(myNormalMCVSOutput) / diffuse;\n',
      false
  );
    renderer.addActor(actor);
    resetCamera();
    render();

}

function getNormal(x1,y1,z1,x2,y2,z2,x3,y3,z3){
    let v1 = [x1,y1,z1];
    let v2 = [x2,y2,z2];
    let v3 = [x3,y3,z3];
    const triNormal = [];
    vtkTriangle.computeNormal(v1,v2,v3,triNormal);
    return triNormal;
  }