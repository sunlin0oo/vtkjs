// import React from 'react'
import '@kitware/vtk.js/favicon';
// import jsondata from './JSON/beam.json';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkTriangle from '@kitware/vtk.js/Common/DataModel/Triangle';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction'
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader'
// 引入颜色模式，标量模式
import {
  ColorMode,
  ScalarMode
} from '@kitware/vtk.js/Rendering/Core/Mapper/Constants';
export default function App() {
    // 创建vtp读取器
    const vtpReader = vtkXMLPolyDataReader.newInstance();
    // 创建角色
    const actor = vtkActor.newInstance();
    // 创建颜色分布
    var lookupTable = vtkColorTransferFunction.newInstance();
    // 创建映射器
    const mapper = vtkMapper.newInstance({
        interpolateScalarsBeforeMapping: true,
        useLookupTableScalarRange: true,
        lookupTable,
        scalarVisibility: true
      });
    
      // init color mode
    mapper.set({
        colorByArrayName: "displacement_X",
        colorMode: 1,
        interpolateScalarsBeforeMapping: true,
        scalarMode: 3,
        scalarVisibility: true
      });
    // 映射连接计算器
    mapper.setInputConnection(vtpReader.getOutputPort());
    // mapper.setInputData(polydata);
    // ----------------------------------------------------------------------------
    // Use a file reader to load a local file
    // ----------------------------------------------------------------------------

    // 创建DOM对象
    const myContainer = document.querySelector('body');
    const fileContainer = document.createElement('div');
    fileContainer.innerHTML = '<input type="file" class="file"/>';
    myContainer.appendChild(fileContainer);

    const fileInput = fileContainer.querySelector('input');

    // ----------------------------------------------------------------------------
    fileInput.addEventListener('change', handleFile);

    function handleFile(event) {
        event.preventDefault();
        const dataTransfer = event.dataTransfer;
        // 确认文件成功传输（获取上传的文件信息，可拖拽）
        const files = event.target.files || dataTransfer.files;
        if (files.length === 1) {
            myContainer.removeChild(fileContainer);
            // 让客户端浏览器对用户本地文件进行读取
            const fileReader = new FileReader();
            fileReader.onload = function onLoad(e) {
            // 可以进行二进制编码读取
            vtpReader.parseAsArrayBuffer(fileReader.result);
            const source = vtpReader.getOutputData(0);
            mapper.setInputData(source);
            actor.setMapper(mapper);
                //  const JsonPolydata = BuildPolydata(jsondata);
            const preset = {
                ColorSpace: "RGB",
                Name: "Turbo",
                RGBPoint:[
                0,
                0.2980392156862745,
                0.07058823529411765,
                0.3843137254901961,
                0.05263157894736842,
                0.24705882352941178,
                0.12549019607843137,
                0.592156862745098,
                0.10526315789473684,
                0.19607843137254902,
                0.1803921568627451,
                0.796078431372549,
                0.15789473684210525,
                0.2,
                0.3333333333333333,
                0.8588235294117647,
                0.21052631578947367,
                0.2,
                0.48627450980392156,
                0.9176470588235294,
                0.2631578947368421,
                0.20392156862745098,
                0.6431372549019608,
                0.9803921568627451,
                0.3157894736842105,
                0.2980392156862745,
                0.7215686274509804,
                0.792156862745098,
                0.3684210526315789,
                0.396078431372549,
                0.8,
                0.6039215686274509,
                0.42105263157894735,
                0.49411764705882355,
                0.8784313725490196,
                0.4117647058823529,
                0.47368421052631576,
                0.5882352941176471,
                0.9607843137254902,
                0.2235294117647059,
                0.5263157894736842,
                0.6941176470588235,
                0.9764705882352941,
                0.11764705882352941,
                0.5789473684210527,
                0.807843137254902,
                0.9333333333333333,
                0.10196078431372549,
                0.631578947368421,
                0.9215686274509803,
                0.8862745098039215,
                0.08627450980392157,
                0.6842105263157895,
                0.9294117647058824,
                0.7254901960784313,
                0.07058823529411765,
                0.7368421052631579,
                0.9372549019607843,
                0.5568627450980392,
                0.054901960784313725,
                0.7894736842105263,
                0.9450980392156862,
                0.39215686274509803,
                0.043137254901960784,
                0.8421052631578947,
                0.9411764705882353,
                0.23529411764705882,
                0.027450980392156862,
                0.8947368421052632,
                0.8274509803921568,
                0.1568627450980392,
                0.0196078431372549,
                0.9473684210526315,
                0.7137254901960784,
                0.0784313725490196,
                0.00784313725490196,
                1,
                0.6,
                0,
                0
                ],
            }
            const scalars = source.getPointData().getScalars();
            const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);
            lookupTable.applyColorMap(preset);
            lookupTable.setMappingRange(dataRange[0], dataRange[1]);
            lookupTable.updateRange();
            // 渲染 
            update()
            };
            // 浏览器中处理大文件
            fileReader.readAsArrayBuffer(files[0]);
        }
    }
     // 渲染 
    function update() {

        const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
        const renderer = fullScreenRenderer.getRenderer();
        const renderWindow = fullScreenRenderer.getRenderWindow();

        const resetCamera = renderer.resetCamera;
        const render = renderWindow.render;

        renderer.addActor(actor);
        resetCamera();
        render();
    }
}

// 获取Polydata数据
function BuildPolydata(jsondata) {
    // 获取到面总数量
    const faceLength = jsondata.face_list.length;
    // 获取到三角面总数量
    let numTriangles = 0; // numTriangles === nbFaces
    let numdimesion = 0;
    for (let i = 0; i < faceLength; i++) {
      numTriangles += jsondata.face_list[i].number_of_triangles;
      numdimesion += jsondata.face_list[i].vertex_coord.length;
    }
    // console.log("numTriangles", numTriangles);
    // 记录三角形的个数==>用于存储数组位数
    let allTriIndex = 0;
    // 存储顶点维度
    const pointValues = new Float32Array(numdimesion);
    // 存储法向量
    const normalValues = new Float32Array(numTriangles * 3);
    // 存储Cell 对应C++中trangles
    const cellValues = new Uint32Array(numTriangles * 4);
    const cellDataValues = new Uint16Array(numTriangles);
    let cellOffset = 0;
    // 记录之前所有面的顶点数量
    let last_vertex_coord = 0;
    // 记录当前顶点维度的位置
    let pointValuesIndex = 0;
    // 创建polydata数据集合
    const polydata = vtkPolyData.newInstance();
    // 读取数据
    for (let faceIdx = 0; faceIdx < faceLength; faceIdx++) {
      // 记录每个面所含有的三角形
      const triOfFaceLength = jsondata.face_list[faceIdx].number_of_triangles;
      // points.setNumberOfPoints(triOfFaceLength*3);
      const vertexLength = jsondata.face_list[faceIdx].vertex_coord.length;
      for (let i = 0; i < vertexLength; i++) {
        pointValues[pointValuesIndex] = (jsondata.face_list[faceIdx].vertex_coord[i]);
        pointValuesIndex++;
      }
      for (let triIndex = 0; triIndex < triOfFaceLength; triIndex++) {
        //  获取三角形顶点0, 1, 2
        const tri_vertex_index_0 = jsondata.face_list[faceIdx].tri_vertex_index[0 + (triIndex * 3)];
        const tri_vertex_index_1 = jsondata.face_list[faceIdx].tri_vertex_index[1 + (triIndex * 3)];
        const tri_vertex_index_2 = jsondata.face_list[faceIdx].tri_vertex_index[2 + (triIndex * 3)];
        // 计算三角面的面法向量
        const normalValue = getNormal(jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_0) * 3 + 0],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_0) * 3 + 1],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_0) * 3 + 2],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_1) * 3 + 0],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_1) * 3 + 1],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_1) * 3 + 2],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_2) * 3 + 0],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_2) * 3 + 1],
                                    jsondata.face_list[faceIdx].vertex_coord[(tri_vertex_index_2) * 3 + 2]);
        normalValues[allTriIndex * 3 + 0] = normalValue[0];
        normalValues[allTriIndex * 3 + 1] = normalValue[1];
        normalValues[allTriIndex * 3 + 2] = normalValue[2];
        // 3表示一个单元包含的点的个数，id?表示单元所关联的点的Id
        cellValues[cellOffset++] = 3;
        cellValues[cellOffset++] = last_vertex_coord + jsondata.face_list[faceIdx].tri_vertex_index[(triIndex * 3) + 0];
        cellValues[cellOffset++] = last_vertex_coord + jsondata.face_list[faceIdx].tri_vertex_index[(triIndex * 3) + 1];
        cellValues[cellOffset++] = last_vertex_coord + jsondata.face_list[faceIdx].tri_vertex_index[(triIndex * 3) + 2];
        cellDataValues[allTriIndex] = 0;
        allTriIndex++;
      }
      last_vertex_coord += jsondata.face_list[faceIdx].vertex_coord.length / 3;
    }
    // console.log("polydata::", polydata);
    // Rotate points
    // console.log("JOSN-numTriangles:::", numTriangles);
    // console.log("JOSN-pointValues:::", pointValues);
    // console.log("JOSN-normalValues:::", normalValues);
    // console.log("JOSN-cellValues:::", cellValues);
    // console.log("JOSN-cellDataValues:::", cellDataValues);
  
  // 这样可以将数据进行导入
  // 将顶点数组全部导入，3个为一组，作为几何结构
    polydata.getPoints().setData(pointValues, 3);
  // 将Cell输入导入到CellArray中作为拓扑结构
    polydata.getPolys().setData(cellValues);
    // polydata.getLines().setData(cellValues);
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
    return polydata;
}

function getNormal(x1,y1,z1,x2,y2,z2,x3,y3,z3){
    let v1 = [x1,y1,z1];
    let v2 = [x2,y2,z2];
    let v3 = [x3,y3,z3];
    const triNormal = [];
    vtkTriangle.computeNormal(v1,v2,v3,triNormal);
    return triNormal;
}