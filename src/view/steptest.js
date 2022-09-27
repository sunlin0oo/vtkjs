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
    // console.log("polydata::",polydata);
    
    // Rotate points
    // console.log("JOSN-numTriangles:::",numTriangles);
    // console.log("JOSN-pointValues:::",pointValues);
    // console.log("JOSN-normalValues:::",normalValues);
    // console.log("JOSN-cellValues:::",cellValues);
    // console.log("JOSN-cellDataValues:::",cellDataValues);

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
    // 导入结束

    //设定每个顶点的标量值
    // const preset = {
    //       ColorSpace: "RGB",
    //       Name: "Turbo",
    //       RGBPoint:[
    //         0,
    //         0.2980392156862745,
    //         0.07058823529411765,
    //         0.3843137254901961,
    //         0.05263157894736842,
    //         0.24705882352941178,
    //         0.12549019607843137,
    //         0.592156862745098,
    //         0.10526315789473684,
    //         0.19607843137254902,
    //         0.1803921568627451,
    //         0.796078431372549,
    //         0.15789473684210525,
    //         0.2,
    //         0.3333333333333333,
    //         0.8588235294117647,
    //         0.21052631578947367,
    //         0.2,
    //         0.48627450980392156,
    //         0.9176470588235294,
    //         0.2631578947368421,
    //         0.20392156862745098,
    //         0.6431372549019608,
    //         0.9803921568627451,
    //         0.3157894736842105,
    //         0.2980392156862745,
    //         0.7215686274509804,
    //         0.792156862745098,
    //         0.3684210526315789,
    //         0.396078431372549,
    //         0.8,
    //         0.6039215686274509,
    //         0.42105263157894735,
    //         0.49411764705882355,
    //         0.8784313725490196,
    //         0.4117647058823529,
    //         0.47368421052631576,
    //         0.5882352941176471,
    //         0.9607843137254902,
    //         0.2235294117647059,
    //         0.5263157894736842,
    //         0.6941176470588235,
    //         0.9764705882352941,
    //         0.11764705882352941,
    //         0.5789473684210527,
    //         0.807843137254902,
    //         0.9333333333333333,
    //         0.10196078431372549,
    //         0.631578947368421,
    //         0.9215686274509803,
    //         0.8862745098039215,
    //         0.08627450980392157,
    //         0.6842105263157895,
    //         0.9294117647058824,
    //         0.7254901960784313,
    //         0.07058823529411765,
    //         0.7368421052631579,
    //         0.9372549019607843,
    //         0.5568627450980392,
    //         0.054901960784313725,
    //         0.7894736842105263,
    //         0.9450980392156862,
    //         0.39215686274509803,
    //         0.043137254901960784,
    //         0.8421052631578947,
    //         0.9411764705882353,
    //         0.23529411764705882,
    //         0.027450980392156862,
    //         0.8947368421052632,
    //         0.8274509803921568,
    //         0.1568627450980392,
    //         0.0196078431372549,
    //         0.9473684210526315,
    //         0.7137254901960784,
    //         0.0784313725490196,
    //         0.00784313725490196,
    //         1,
    //         0.6,
    //         0,
    //         0,
    //         0,
    //         0.2980392156862745,
    //         0.07058823529411765,
    //         0.3843137254901961,
    //         0.05263157894736842,
    //         0.24705882352941178,
    //         0.12549019607843137,
    //         0.592156862745098,
    //         0.10526315789473684,
    //         0.19607843137254902,
    //         0.1803921568627451,
    //         0.796078431372549,
    //         0.15789473684210525,
    //         0.2,
    //         0.3333333333333333,
    //         0.8588235294117647,
    //         0.21052631578947367,
    //         0.2,
    //         0.48627450980392156,
    //         0.9176470588235294,
    //         0.2631578947368421,
    //         0.20392156862745098,
    //         0.6431372549019608,
    //         0.9803921568627451,
    //         0.3157894736842105,
    //         0.2980392156862745,
    //         0.7215686274509804,
    //         0.792156862745098,
    //         0.3684210526315789,
    //         0.396078431372549,
    //         0.8,
    //         0.6039215686274509,
    //         0.42105263157894735,
    //         0.49411764705882355,
    //         0.8784313725490196,
    //         0.4117647058823529,
    //         0.47368421052631576,
    //         0.5882352941176471,
    //         0.9607843137254902,
    //         0.2235294117647059,
    //         0.5263157894736842,
    //         0.6941176470588235,
    //         0.9764705882352941,
    //         0.11764705882352941,
    //         0.5789473684210527,
    //         0.807843137254902,
    //         0.9333333333333333,
    //         0.10196078431372549,
    //         0.631578947368421,
    //         0.9215686274509803,
    //         0.8862745098039215,
    //         0.08627450980392157,
    //         0.6842105263157895,
    //         0.9294117647058824,
    //         0.7254901960784313,
    //         0.07058823529411765,
    //         0.7368421052631579,
    //         0.9372549019607843,
    //         0.5568627450980392,
    //         0.054901960784313725,
    //         0.7894736842105263,
    //         0.9450980392156862,
    //         0.39215686274509803,
    //         0.043137254901960784,
    //         0.8421052631578947,
    //         0.9411764705882353,
    //         0.23529411764705882,
    //         0.027450980392156862,
    //         0.8947368421052632,
    //         0.8274509803921568,
    //         0.1568627450980392,
    //         0.0196078431372549,
    //         0.9473684210526315,
    //         0.7137254901960784,
    //         0.0784313725490196,
    //         0.00784313725490196,
    //         1,
    //         0.6,
    //         0,
    //         0,
    //         0,
    //         0.2980392156862745,
    //         0.07058823529411765,
    //         0.3843137254901961,
    //         0.05263157894736842,
    //         0.24705882352941178,
    //         0.12549019607843137,
    //         0.592156862745098,
    //         0.10526315789473684,
    //         0.19607843137254902,
    //         0.1803921568627451,
    //         0.796078431372549,
    //         0.15789473684210525,
    //         0.2,
    //         0.3333333333333333,
    //         0.8588235294117647,
    //         0.21052631578947367,
    //         0.2,
    //         0.48627450980392156,
    //         0.9176470588235294,
    //         0.2631578947368421,
    //         0.20392156862745098,
    //         0.6431372549019608,
    //         0.9803921568627451,
    //         0.3157894736842105,
    //         0.2980392156862745,
    //         0.7215686274509804,
    //         0.792156862745098,
    //         0.3684210526315789,
    //         0.396078431372549,
    //         0.8,
    //         0.6039215686274509,
    //         0.42105263157894735,
    //         0.49411764705882355,
    //         0.8784313725490196,
    //         0.4117647058823529,
    //         0.47368421052631576,
    //         0.5882352941176471,
    //         0.9607843137254902,
    //         0.2235294117647059,
    //         0.5263157894736842,
    //         0.6941176470588235,
    //         0.9764705882352941,
    //         0.11764705882352941,
    //         0.5789473684210527,
    //         0.807843137254902,
    //         0.9333333333333333,
    //         0.10196078431372549,
    //         0.631578947368421,
    //         0.9215686274509803,
    //         0.8862745098039215,
    //         0.08627450980392157,
    //         0.6842105263157895,
    //         0.9294117647058824,
    //         0.7254901960784313,
    //         0.07058823529411765,
    //         0.7368421052631579,
    //         0.9372549019607843,
    //         0.5568627450980392,
    //         0.054901960784313725,
    //         0.7894736842105263,
    //         0.9450980392156862,
    //         0.39215686274509803,
    //         0.043137254901960784,
    //         0.8421052631578947,
    //         0.9411764705882353,
    //         0.23529411764705882,
    //         0.027450980392156862,
    //         0.8947368421052632,
    //         0.8274509803921568,
    //         0.1568627450980392,
    //         0.0196078431372549,
    //         0.9473684210526315,
    //         0.7137254901960784,
    //         0.0784313725490196,
    //         0.00784313725490196,
    //         1,
    //         0.6,
    //         0,
    //         0,
    //         0,
    //         0.2980392156862745,
    //         0.07058823529411765,
    //         0.3843137254901961,
    //         0.05263157894736842,
    //         0.24705882352941178,
    //         0.12549019607843137,
    //         0.592156862745098,
    //         0.10526315789473684,
    //         0.19607843137254902,
    //         0.1803921568627451,
    //         0.796078431372549,
    //         0.15789473684210525,
    //         0.2,
    //         0.3333333333333333,
    //         0.8588235294117647,
    //         0.21052631578947367,
    //         0.2,
    //         0.48627450980392156,
    //         0.9176470588235294,
    //         0.2631578947368421,
    //         0.20392156862745098,
    //         0.6431372549019608,
    //         0.9803921568627451,
    //         0.3157894736842105,
    //         0.2980392156862745,
    //         0.7215686274509804,
    //         0.792156862745098,
    //         0.3684210526315789,
    //         0.396078431372549,
    //         0.8,
    //         0.6039215686274509,
    //         0.42105263157894735,
    //         0.49411764705882355,
    //         0.8784313725490196,
    //         0.4117647058823529,
    //         0.47368421052631576,
    //         0.5882352941176471,
    //         0.9607843137254902,
    //         0.2235294117647059,
    //         0.5263157894736842,
    //         0.6941176470588235,
    //         0.9764705882352941,
    //         0.11764705882352941,
    //         0.5789473684210527,
    //         0.807843137254902,
    //         0.9333333333333333,
    //         0.10196078431372549,
    //         0.631578947368421,
    //         0.9215686274509803,
    //         0.8862745098039215,
    //         0.08627450980392157,
    //         0.6842105263157895,
    //         0.9294117647058824,
    //         0.7254901960784313,
    //         0.07058823529411765,
    //         0.7368421052631579,
    //         0.9372549019607843,
    //         0.5568627450980392,
    //         0.054901960784313725,
    //         0.7894736842105263,
    //         0.9450980392156862,
    //         0.39215686274509803,
    //         0.043137254901960784,
    //         0.8421052631578947,
    //         0.9411764705882353,
    //         0.23529411764705882,
    //         0.027450980392156862,
    //         0.8947368421052632,
    //         0.8274509803921568,
    //         0.1568627450980392,
    //         0.0196078431372549,
    //         0.9473684210526315,
    //         0.7137254901960784,
    //         0.0784313725490196,
    //         0.00784313725490196,
    //         1,
    //         0.6,
    //         0,
    //         0,
    //         0,
    //         0.2980392156862745,
    //         0.07058823529411765,
    //         0.3843137254901961,
    //         0.05263157894736842,
    //         0.24705882352941178,
    //         0.12549019607843137,
    //         0.592156862745098,
    //         0.10526315789473684,
    //         0.19607843137254902,
    //         0.1803921568627451,
    //         0.796078431372549,
    //         0.15789473684210525,
    //         0.2,
    //         0.3333333333333333,
    //         0.8588235294117647,
    //         0.21052631578947367,
    //         0.2,
    //         0.48627450980392156,
    //         0.9176470588235294,
    //         0.2631578947368421,
    //         0.20392156862745098,
    //         0.6431372549019608,
    //         0.9803921568627451,
    //         0.3157894736842105,
    //         0.2980392156862745,
    //         0.7215686274509804,
    //         0.792156862745098,
    //         0.3684210526315789,
    //         0.396078431372549,
    //         0.8,
    //         0.6039215686274509,
    //         0.42105263157894735,
    //         0.49411764705882355,
    //         0.8784313725490196,
    //         0.4117647058823529,
    //         0.47368421052631576,
    //         0.5882352941176471,
    //         0.9607843137254902,
    //         0.2235294117647059,
    //         0.5263157894736842,
    //         0.6941176470588235,
    //         0.9764705882352941,
    //         0.11764705882352941,
    //         0.5789473684210527,
    //         0.807843137254902,
    //         0.9333333333333333,
    //         0.10196078431372549,
    //         0.631578947368421,
    //         0.9215686274509803,
    //         0.8862745098039215,
    //         0.08627450980392157,
    //         0.6842105263157895,
    //         0.9294117647058824,
    //         0.7254901960784313,
    //         0.07058823529411765,
    //         0.7368421052631579,
    //         0.9372549019607843,
    //         0.5568627450980392,
    //         0.054901960784313725,
    //         0.7894736842105263,
    //         0.9450980392156862,
    //         0.39215686274509803,
    //         0.043137254901960784,
    //         0.8421052631578947,
    //         0.9411764705882353,
    //         0.23529411764705882,
    //         0.027450980392156862,
    //         0.8947368421052632,
    //         0.8274509803921568,
    //         0.1568627450980392,
    //         0.0196078431372549,
    //         0.9473684210526315,
    //         0.7137254901960784,
    //         0.0784313725490196,
    //         0.00784313725490196,
    //         1,
    //         0.6,
    //         0,
    //         0,
    //         0,
    //         0.2980392156862745,
    //         0.07058823529411765,
    //         0.3843137254901961,
    //         0.05263157894736842,
    //         0.24705882352941178,
    //         0.12549019607843137,
    //         0.592156862745098,
    //         0.10526315789473684,
    //         0.19607843137254902,
    //         0.1803921568627451,
    //         0.796078431372549,
    //         0.15789473684210525,
    //         0.2,
    //         0.3333333333333333,
    //         0.8588235294117647,
    //         0.21052631578947367,
    //         0.2,
    //         0.48627450980392156,
    //         0.9176470588235294,
    //         0.2631578947368421,
    //         0.20392156862745098,
    //         0.6431372549019608,
    //         0.9803921568627451,
    //         0.3157894736842105,
    //         0.2980392156862745,
    //         0.7215686274509804,
    //         0.792156862745098,
    //         0.3684210526315789,
    //         0.396078431372549,
    //         0.8,
    //         0.6039215686274509,
    //         0.42105263157894735,
    //         0.49411764705882355,
    //         0.8784313725490196,
    //         0.4117647058823529,
    //         0.47368421052631576,
    //         0.5882352941176471,
    //         0.9607843137254902,
    //         0.2235294117647059,
    //         0.5263157894736842,
    //         0.6941176470588235,
    //         0.9764705882352941,
    //         0.11764705882352941,
    //         0.5789473684210527,
    //         0.807843137254902,
    //         0.9333333333333333,
    //         0.10196078431372549,
    //         0.631578947368421,
    //         0.9215686274509803,
    //         0.8862745098039215,
    //         0.08627450980392157,
    //         0.6842105263157895,
    //         0.9294117647058824,
    //         0.7254901960784313,
    //         0.07058823529411765,
    //         0.7368421052631579,
    //         0.9372549019607843,
    //         0.5568627450980392,
    //         0.054901960784313725,
    //         0.7894736842105263,
    //         0.9450980392156862,
    //         0.39215686274509803,
    //         0.043137254901960784,
    //         0.8421052631578947,
    //         0.9411764705882353,
    //         0.23529411764705882,
    //         0.027450980392156862,
    //         0.8947368421052632,
    //         0.8274509803921568,
    //         0.1568627450980392,
    //         0.0196078431372549,
    //         0.9473684210526315,
    //         0.7137254901960784,
    //         0.0784313725490196,
    //         0.00784313725490196,
    //         1,
    //         0.6,
    //         0,
    //         0
    //       ],
    // }

    // 这样设置才会与lookuptable进行相互的关联
    const preset = vtkColorMaps.getPresetByName('Turbo');
    console.log(preset);
    //载入每个顶点的标量值--设置点集标量
    polydata.getPointData().setScalars(vtkDataArray.newInstance({
      name: 'Attribute',
      values: [...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,
        ...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,
        ...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,...preset.RGBPoints,
      ]
    }));

    console.log('polydata.GetNumberOfPoints()', polydata.getNumberOfPoints());//获取到polydata中点的数据
    // // 区域数据中的数组的数目
    // let newAarry =polydata.getPointData().getNumberOfArrays();// 获取到polydata中点集数据
    // console.log('newAarry', newAarry);
    // // 给定一个名字,返回对应的数组
    // console.log('getArrayName', polydata.getPointData().getArrayName(0));
    // // 给定一个索引,返回对应的数组
    // console.log('getArray', polydata.getPointData().getArray(0));
    // // 数据的范围 
    // console.log('getRange', polydata.getPointData().getArray(0).getRange());


    // 创建角色
    
    const actor = vtkActor.newInstance();
    // 颜色查找表
    var lookupTable = vtkColorTransferFunction.newInstance();
    // 创建映射器
    // const mapper = vtkMapper.newInstance();
    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: false,
      useLookupTableScalarRange: true,
      lookupTable,
      scalarVisibility: false,
    });
      // Mapper==>存放数据和渲染信息==>将输入数据转换为几何图元进行渲染
    // 映射连接计算器
    mapper.setInputData(polydata); 
    actor.setMapper(mapper);
    mapper.set({
      colorByArrayName: "displacement_X",
      interpolateScalarsBeforeMapping: true,
      colorMode: ColorMode.MAP_SCALARS,
      // colorMode: 1,
      // scalarMode: 1,// 总是使用点标量属性数据进行映射的
      scalarMode: ScalarMode.USE_POINT_DATA,// 总是使用点标量属性数据进行映射的
      // scalarMode: ScalarMode.USE_CELL_DATA,// 总是使用单元标量属性数据进行映射的
      // scalarMode: ScalarMode.USE_POINT_FIELD_DATA, // 利用点属性数据中的数据数组。而不是点标量数据和单元标量数据
      // scalarMode: ScalarMode.USE_CELL_FIELD_DATA, //利用单元属性数据中得场数据。而不是点或者单元标量数据
      // scalarMode: ScalarMode.USE_POINT_DUSE_FIELD_DATAATA,
      scalarVisibility: true,//设置是否进行标量渲染
    });

    //设置颜色表中的颜色
    // const preset = vtkColorMaps.getPresetByName(presetelector.value);
    lookupTable.applyColorMap(preset);
    // 颜色映射的范围值
    lookupTable.setMappingRange(-0.2,3);
    // 更新颜色映射的范围值
    lookupTable.updateRange();

    // // 改变面片颜色
    // lookupTable.set
    // lookupTable.setMappingRange(0.67, 0.0);   
    // lookupTable.addRGBPoint(0, 1.0, 1.50, 1.0); //red
    // mapper.setLookupTable(lookup);
    // console.log("actor.getProperty().set()", actor.getProperty())
    // 环境光系数
    // actor.getProperty().setAmbient(1);
    // 漫反射
    // actor.getProperty().setDiffuse(1.5);
    //高光强度
    // actor.getProperty().setSpecularPower(10);
    // 是否显示线段
    actor.getProperty().setEdgeVisibility(true);
    // 渲染模式
    actor.getProperty().setRepresentation(2);
    // 表面线框模式才能进行设置边框颜色
    // actor.getProperty().setColor([0, 0, 0]);
    // 线段颜色
    // actor.getProperty().setEdgeColor([1,1,1]);
    // 不透明度
    actor.getProperty().setOpacity(1);
    // 线段宽度
    // actor.getProperty().setLineWidth(1);
    // 角色中加入映射
    // actor.setMapper(mapper);
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