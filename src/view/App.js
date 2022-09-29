import '@kitware/vtk.js/favicon';
// import jsondata from './3M-10268-6212PC.json';
// import jsondatabeam from './beam.json';
// import jsondataTO from './TO-247AD-H.json';
// Load the rendering pieces we want to use (for both WebGL and WebGPU)

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSTLReader from '@kitware/vtk.js/IO/Geometry/STLReader';


function App() {
  // Example code
  // ----------------------------------------------------------------------------
  // 创建一个STL新类
  const reader = vtkSTLReader.newInstance();
  // 创建映射器
  const mapper = vtkMapper.newInstance({ scalarVisibility: false });
  // 创建角色
  const actor = vtkActor.newInstance();
  // 角色中加入映射
  actor.setMapper(mapper);
  // 映射连接计算器
  mapper.setInputConnection(reader.getOutputPort());

  // reader.jsonRender(jsondatabeam);
  // // 渲染 
  // update();

  // ----------------------------------------------------------------------------
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
          reader.parseAsArrayBuffer(fileReader.result);
          // reader.jsonRender(jsondata);
          // 渲染 
          update();
        };
        // 浏览器中处理大文件
        fileReader.readAsArrayBuffer(files[0]);
    }
  }

}

export default App;