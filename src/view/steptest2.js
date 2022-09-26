import React from 'react'
import '@kitware/vtk.js/favicon';
import jsondata from './JSON/beam.json';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkTriangle from '@kitware/vtk.js/Common/DataModel/Triangle';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction'
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
    
    // 获取到面总数量
    let faceLength = jsondata.face_list.length;
    
    //获取到三角面总数量
    let numTriangles = 0; //numTriangles === nbFaces
    let numdimesion = 0;
    for(let i=0;i<faceLength;i++){
      numTriangles += jsondata.face_list[i].number_of_triangles;
      numdimesion += jsondata.face_list[i].vertex_coord.length;
    }
    console.log("numTriangles",numTriangles);
    console.log()
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
    let surfaceActor = surface(faceLength,allTriIndex,pointValues,normalValues,cellValues,cellDataValues,cellOffset,last_vertex_coord,pointValuesIndex);
    let lineActor = line(faceLength,allTriIndex,pointValues,normalValues,cellValues,cellDataValues,cellOffset,last_vertex_coord,pointValuesIndex);

    // actor.getProperty().setEdgeVisibility(true);
    // actor.getProperty().setEdgeColor([0.5, 0, 0.6]);
    // actor.getProperty().setOpacity(0.5);
    // actor.getProperty().setLineWidth(1);
    renderer.addActor(surfaceActor);
    renderer.addActor(lineActor);
    // renderer.removeActor(surfaceActor);
    let name = renderer.getActors();
    console.log("name[0]:",name[0].get());
    console.log("name[1]:",name[1].get());
    renderer.resetCamera();
    resetCamera();
    render();
}

function surface(faceLength,allTriIndex,pointValues,normalValues,cellValues,cellDataValues,cellOffset,last_vertex_coord,pointValuesIndex){
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

// 这样可以将数据进行导入
// 将顶点数组全部导入，3个为一组，作为几何结构
  polydata.getPoints().setData(pointValues, 3);
//将Cell输入导入到CellArray中作为拓扑结构
  polydata.getPolys().setData(cellValues);

  polydata.getCellData().setScalars(vtkDataArray.newInstance({
    name: 'Attribute',
    values: cellDataValues
  }));
  polydata.getCellData().setNormals(vtkDataArray.newInstance({
    name: 'Normals',
    values: normalValues,
    numberOfComponents: 3
  })); // Add new output
    // 改变面片颜色
    var lookup = vtkColorTransferFunction.newInstance();
    // 创建映射器
    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: true,
      useLookupTableScalarRange: true,
      lookupTable:lookup,
      scalarVisibility: true
    });
    // 创建角色
    const actor = vtkActor.newInstance();
    
    lookup.addRGBPoint(0, 0.0, 1.0, 0.0); //red
    // lookup.addRGBPoint(1, 1.0, 1.0, 1.0); //white
    // lookup.addRGBPoint(2, 1.0, 1.0, 1.0); //green
    // lookup.build();
    // mapper.setLookupTable(lookup);
    // Mapper==>存放数据和渲染信息==>将输入数据转换为几何图元进行渲染
    // 映射连接计算器;
    mapper.setInputData(polydata); 
    // 角色中加入映射
    actor.setMapper(mapper);

  return actor
}

function line(faceLength,allTriIndex,pointValues,normalValues,cellValues,cellDataValues,cellOffset,last_vertex_coord,pointValuesIndex){
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
  };
  polydata.getPoints().setData(pointValues, 3);
  polydata.getLines().setData(cellValues);
  polydata.getCellData().setScalars(vtkDataArray.newInstance({
    name: 'Attribute',
    values: cellDataValues
  }));
  polydata.getCellData().setNormals(vtkDataArray.newInstance({
    name: 'Normals',
    values: normalValues,
    numberOfComponents: 3
  })); // Add new output

  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  // 颜色传递函数
  var lookup = vtkColorTransferFunction.newInstance();
  // 修改object颜色
  lookup.addRGBPoint(0, 9, 1, 0); //red
  // lookup.addRGBPoint(1, 1.0, 1.0, 0.0); //white
  // lookup.addRGBPoint(2, 0.0, 0.0, 0.0); //green
  lookup.build();
  mapper.setLookupTable(lookup);
  mapper.setInputData(polydata);
  actor.getProperty().setAmbient(1);
  actor.getProperty().setDiffuse(0);
  actor.setMapper(mapper);

  return actor
}

function getNormal(x1,y1,z1,x2,y2,z2,x3,y3,z3){
    let v1 = [x1,y1,z1];
    let v2 = [x2,y2,z2];
    let v3 = [x3,y3,z3];
    const triNormal = [];
    vtkTriangle.computeNormal(v1,v2,v3,triNormal);
    return triNormal;
  }