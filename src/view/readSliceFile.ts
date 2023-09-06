import '@kitware/vtk.js/favicon';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';

import { BuildPolyData } from '../utils/polyDataBuild'
import jsonData from './JSON/e06c81db-f405-4457-8ae8-0027bdf934e2_Beam.json'
import slice1 from './JSON/fpv-1.json'
import slice2 from './JSON/fpv-2.json'
import slice3 from './JSON/fpv-3.json'
import slice4 from './JSON/fpv-4.json'
import slice5 from './JSON/fpv-5.json'
import slice6 from './JSON/fpv-6.json'
import slice7 from './JSON/fpv-7.json'
import slice8 from './JSON/fpv-8.json'
import slice9 from './JSON/fpv-9.json'
function addActor(source, renderer, render, resetCamera) {
    const buildData = BuildPolyData(source);
    const polydata = vtkPolyData.newInstance();
    // 这样可以将数据进行导入
    // 将顶点数组全部导入，3个为一组，作为几何结构
    //1.很自信这个对象一定存在，可以用 ! 解决
    // polydata.getPoints().setData(buildData!.pointValues, 3);
    // // //将Cell输入导入到CellArray中作为拓扑结构
    // polydata.getPolys().setData(buildData!.cellValues);
    // 2.最正确的解决方案，就是加null的判断
    if (buildData) {
        polydata.getPoints().setData(buildData!.pointValues, 3);
        // //将Cell输入导入到CellArray中作为拓扑结构
        polydata.getPolys().setData(buildData!.cellValues);
    }
    const actor = vtkActor.newInstance();
    // 颜色查找表
    const mapper = vtkMapper.newInstance();
    // Mapper==>存放数据和渲染信息==>将输入数据转换为几何图元进行渲染
    // 映射连接计算器
    mapper.setInputData(polydata);
    actor.setMapper(mapper);

    renderer.addActor(actor);
    // renderer.setBackground(0.8, 0.8, 0.8);

    resetCamera();
    render();
}
export default function App() {
    //渲染没有问题
    //Standard rendering code setup
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    const resetCamera = renderer.resetCamera;
    const render = renderWindow.render;
    // console.log('slice1', slice1, 'slice2', slice2);
    addActor(slice1, renderer, render, resetCamera);
    addActor(slice2, renderer, render, resetCamera);
    addActor(slice3, renderer, render, resetCamera);
    addActor(slice4, renderer, render, resetCamera);
    addActor(slice5, renderer, render, resetCamera);
    addActor(slice6, renderer, render, resetCamera);
    addActor(slice7, renderer, render, resetCamera);
    // addActor(slice9, renderer, render, resetCamera);


}

