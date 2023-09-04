// import React from 'react'
import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';

import { BuildPolyData } from '../utils/polyDataBuild'
import jsonData from './JSON/e06c81db-f405-4457-8ae8-0027bdf934e2_Beam.json'
import slice1 from './JSON/beam-1.json'
import slice2 from './JSON/beam-2.json'
// import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

type BuildData = {
    pointValues?: Float32Array;
    cellValues?: Uint32Array;
  };
  

export default function App() {
    //渲染没有问题
    //Standard rendering code setup
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;
    console.log('slice1', slice1, 'slice2', slice2);
    // const BuildData = BuildPolyData(jsonData);
    // const pointValues:Float32Array | undefined = BuildData?.pointValues;
    // const cellValues:Uint32Array | undefined = BuildData?.cellValues;
    const { pointValues, cellValues } = BuildPolyData(jsonData);
    const polydata = vtkPolyData.newInstance();
    // 这样可以将数据进行导入
    // 将顶点数组全部导入，3个为一组，作为几何结构
    polydata.getPoints().setData(pointValues, 3);
    // //将Cell输入导入到CellArray中作为拓扑结构
    polydata.getPolys().setData(cellValues);

    const actor = vtkActor.newInstance();
    // 颜色查找表

    const mapper = vtkMapper.newInstance();
    // Mapper==>存放数据和渲染信息==>将输入数据转换为几何图元进行渲染
    // 映射连接计算器
    mapper.setInputData(polydata);
    actor.setMapper(mapper);

    renderer.addActor(actor);
    renderer.setBackground(0.8, 0.8, 0.8);

    resetCamera();
    render();

}

