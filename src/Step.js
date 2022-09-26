import React from 'react'
import '@kitware/vtk.js/favicon';
import jsondata from './view/JSON/3M-10268-6212PC.json';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction'
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkTriangle from '@kitware/vtk.js/Common/DataModel/Triangle';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';

export default function App() {
    //渲染没有问题
    //Standard rendering code setup
     const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
     const renderer = fullScreenRenderer.getRenderer();
     const renderWindow = fullScreenRenderer.getRenderWindow();
     const resetCamera = renderer.resetCamera;
     const render = renderWindow.render;

    console.log("jsondata",jsondata);

    if (!jsondata) {
      return;
    } 
    
    // 获取到面总数量
    let faceLength = jsondata.face_list.length;
    
    //获取到三角面总数量
    let numTriangles = 0; //numTriangles === nbFaces
    for(let i=0;i<faceLength;i++){
      numTriangles += jsondata.face_list[i].number_of_triangles;
    }
    console.log("numTriangles",numTriangles);


    // 记录三角形的个数==>用于存储数组位数
    let allTriIndex = 0;
    // 存储顶点
    var pointValues = new Float32Array(numTriangles * 9);
    // 存储法向量
    var normalValues = new Float32Array(numTriangles * 3);
    // 存储Cell 对应C++中trangles
    var cellValues = new Uint32Array(numTriangles * 4);
    var cellDataValues = new Uint16Array(numTriangles);
    var cellOffset = 0;
    //读取数据
    for (var faceIdx = 0; faceIdx < faceLength; faceIdx++) {
      // 创建polydata数据集合
      var polydata = vtkPolyData.newInstance();
      //Point构造函数
      // var points = vtkPoints.newInstance();
      //CellArray构造函数
      var cell = vtkCellArray.newInstance();
      // 记录每个面所含有的三角形
      let triOfFaceLength = jsondata.face_list[faceIdx].number_of_triangles
      // points.setNumberOfPoints(triOfFaceLength*3);
      for(let triIndex =0;triIndex < triOfFaceLength;triIndex++){
        // x1
        pointValues[allTriIndex * 9 + 0] = jsondata.face_list[faceIdx].tri_vertex_coord[0 + (triIndex * 9)];
        // y1
        pointValues[allTriIndex * 9 + 1] = jsondata.face_list[faceIdx].tri_vertex_coord[1 + (triIndex * 9)];
        // z1
        pointValues[allTriIndex * 9 + 2] = jsondata.face_list[faceIdx].tri_vertex_coord[2 + (triIndex * 9)];
        // x2
        pointValues[allTriIndex * 9 + 3] = jsondata.face_list[faceIdx].tri_vertex_coord[3 + (triIndex * 9)];
        // y2
        pointValues[allTriIndex * 9 + 4] = jsondata.face_list[faceIdx].tri_vertex_coord[4 + (triIndex * 9)];
        // z2
        pointValues[allTriIndex * 9 + 5] = jsondata.face_list[faceIdx].tri_vertex_coord[5 + (triIndex * 9)];
        // x3
        pointValues[allTriIndex * 9 + 6] = jsondata.face_list[faceIdx].tri_vertex_coord[6 + (triIndex * 9)];
        // y3
        pointValues[allTriIndex * 9 + 7] = jsondata.face_list[faceIdx].tri_vertex_coord[7 + (triIndex * 9)];
        // z3
        pointValues[allTriIndex * 9 + 8] = jsondata.face_list[faceIdx].tri_vertex_coord[8 + (triIndex * 9)];
        // 计算三角面的面法向量
        let normalValue = getNormal(pointValues[allTriIndex * 9 + 0],
                                    pointValues[allTriIndex * 9 + 1],
                                    pointValues[allTriIndex * 9 + 2],
                                    pointValues[allTriIndex * 9 + 3],
                                    pointValues[allTriIndex * 9 + 4],
                                    pointValues[allTriIndex * 9 + 5],
                                    pointValues[allTriIndex * 9 + 6],
                                    pointValues[allTriIndex * 9 + 7],
                                    pointValues[allTriIndex * 9 + 8]);
        normalValues[allTriIndex * 3 + 0] = normalValue[0];
        normalValues[allTriIndex * 3 + 1] = normalValue[1];
        normalValues[allTriIndex * 3 + 2] = normalValue[2];
        // 3表示一个单元包含的点的个数，id?表示单元所关联的点的Id
        cellValues[cellOffset++] = 3;
        cellValues[cellOffset++] = allTriIndex * 3 + 0;
        cellValues[cellOffset++] = allTriIndex * 3 + 1;
        cellValues[cellOffset++] = allTriIndex * 3 + 2;
        cellDataValues[allTriIndex] = 0;
        
        allTriIndex++;
      }
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
    // polydata.getPolys().setData(cellValues);
    polydata.getLines().setData(cellValues);
    // polydata.getVerts().setData(cellValues);

    polydata.getCellData().setScalars(vtkDataArray.newInstance({
      name: 'Attribute',
      values: cellDataValues
    }));
    polydata.getCellData().setNormals(vtkDataArray.newInstance({
      name: 'Normals',
      values: normalValues,
      numberOfComponents: 3
    })); // Add new output
    
    console.log('Nb of points: ', polydata.getPoints().getData().length);
    console.log('Nb of cells: ', polydata.getPolys().getData().length);
    // 查看polydata内容
    console.log('Nb of cellDataValues: ', polydata.getCellData().getScalars().getData());
    // 创建映射器==>上限问题
    const mapper = vtkMapper.newInstance();
    // 创建角色
    const actor = vtkActor.newInstance();
    var lookup = vtkColorTransferFunction.newInstance();
    // 改变面片颜色
    lookup.addRGBPoint(0, 1.0, 1.0, 1.0); //red
    lookup.addRGBPoint(1, 1.0, 1.0, 1.0); //white
    lookup.addRGBPoint(2, 1.0, 1.0, 1.0); //green
    lookup.build();
    // Mapper==>存放数据和渲染信息==>将输入数据转换为几何图元进行渲染
    // 映射连接计算器
   
    
    mapper.setLookupTable(lookup);
    // mapper.setScalarRange(0, 10);
    // 改变线的颜色
    // actor.getProperty().setColor(1.0, 0.0, 1.0)
    // actor.getProperty().setAmbient(1);
    // actor.getProperty().setDiffuse(0);
    // 角色中加入映射
    mapper.setInputData(polydata); 
    actor.setMapper(mapper);
    
    renderer.addActor(actor);
    resetCamera();
    // ==>上限问题
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