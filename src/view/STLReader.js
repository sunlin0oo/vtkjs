import BinaryHelper from '@kitware/vtk.js/IO/Core/BinaryHelper.js';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper.js';
import macro from '@kitware/vtk.js/macros.js';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray.js';
import vtkMatrixBuilder from '@kitware/vtk.js/Common/Core/MatrixBuilder.js';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData.js';
import vtkTriangle from '@kitware/vtk.js/Common/DataModel/Triangle';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper.js';

var vtkErrorMacro = macro.vtkErrorMacro;

function parseHeader(headerString) {
  var headerSubStr = headerString.split(' ');
  var fieldValues = headerSubStr.filter(function (e) {
    return e.indexOf('=') > -1;
  });
  var header = {};

  for (var i = 0; i < fieldValues.length; ++i) {
    var fieldValueStr = fieldValues[i];
    var fieldValueSubStr = fieldValueStr.split('=');

    if (fieldValueSubStr.length === 2) {
      header[fieldValueSubStr[0]] = fieldValueSubStr[1];
    }
  }

  return header;
}

function addValuesToArray(src, dst) {
  for (var i = 0; i < src.length; i++) {
    dst.push(src[i]);
  }
} // facet normal ni nj nk
//     outer loop
//         vertex v1x v1y v1z
//         vertex v2x v2y v2z
//         vertex v3x v3y v3z
//     endloop
// endfacet


function readTriangle(lines, offset, points, cellArray, cellNormals) {
  var normalLine = lines[offset];

  if (normalLine === undefined) {
    return -1;
  }

  if (normalLine.indexOf('endfacet') !== -1) {
    return offset + 1;
  }

  if (normalLine.indexOf('facet') === -1) {
    return offset + 1; // Move to next line
  }

  var nbVertex = 0;
  var nbConsumedLines = 2;
  var firstVertexIndex = points.length / 3;
  var normal = normalLine.split(/[ \t]+/).filter(function (i) {
    return i;
  }).slice(-3).map(Number);
  addValuesToArray(normal, cellNormals);

  while (lines[offset + nbConsumedLines].indexOf('vertex') !== -1) {
    var line = lines[offset + nbConsumedLines];
    var coords = line.split(/[ \t]+/).filter(function (i) {
      return i;
    }).slice(-3).map(Number);
    addValuesToArray(coords, points);
    nbVertex++;
    nbConsumedLines++;
  }

  cellArray.push(nbVertex);

  for (var i = 0; i < nbVertex; i++) {
    cellArray.push(firstVertexIndex + i);
  }

  while (lines[offset + nbConsumedLines] && lines[offset + nbConsumedLines].indexOf('endfacet') !== -1) {
    nbConsumedLines++;
  } // +1 (endfacet) +1 (next facet)


  return offset + nbConsumedLines + 2;
} // ----------------------------------------------------------------------------
// vtkSTLReader methods
// ----------------------------------------------------------------------------


function vtkSTLReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSTLReader'); // Create default dataAccessHelper if not available

  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  } // Internal method to fetch Array

  function fetchData(url) {
    var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var compression = option.compression !== undefined ? option.compression : model.compression;
    var progressCallback = option.progressCallback !== undefined ? option.progressCallback : model.progressCallback;

    if (option.binary) {
      return model.dataAccessHelper.fetchBinary(url, {
        compression: compression,
        progressCallback: progressCallback
      });
    }

    return model.dataAccessHelper.fetchText(publicAPI, url, {
      compression: compression,
      progressCallback: progressCallback
    });
  } // Set DataSet url

  function getNormal(x1,y1,z1,x2,y2,z2,x3,y3,z3){
    let v1 = [x1,y1,z1];
    let v2 = [x2,y2,z2];
    let v3 = [x3,y3,z3];
    const triNormal = [];
    vtkTriangle.computeNormal(v1,v2,v3,triNormal);
    return triNormal;
  }

  publicAPI.jsonRender = function(jsondata){
    console.log("jsondata",jsondata);
    if (!jsondata) {
      return;
    } 

    // 获取到面总数量
    let faceLength = jsondata.face_list.length;
    let numTriangles = 0; //numTriangles === nbFaces
    //获取到三角面总数量
    for(let i=0;i<faceLength;i++){
      numTriangles += jsondata.face_list[i].number_of_triangles;
    }
    console.log("numTriangles",numTriangles)
    // 记录三角形的个数==>用于存储数组位数
    let allTriLength = 0;
    // 这里的顶点坐标是四个顶点坐标，也就是三角形进行拼接，这样总会缺少两个顶点
    var pointValues = new Float32Array(numTriangles * 9);
    var normalValues = new Float32Array(numTriangles * 3);
    var cellValues = new Uint32Array(numTriangles * 4);
    var cellDataValues = new Uint16Array(numTriangles);
    var cellOffset = 0;

    // 检查：核实数量比例（正确）==>核实参数顺序（根据stl坐标去进行核实）
    // 以Face为外围循环，tri为每个面的内围循环
    for (var faceIdx = 0; faceIdx < faceLength; faceIdx++) {
      // 创建polydata数据集合
      var polydata = vtkPolyData.newInstance();
      // 记录每个面所含有的三角形
      let triOfFaceLength = jsondata.face_list[faceIdx].number_of_triangles
      for(let triIndex =0;triIndex < triOfFaceLength;triIndex++){
        let triangle = vtkTriangle.newInstance();
        console.log("triangle::",triangle)
        // x1
        pointValues[allTriLength * 9 + 0] = jsondata.face_list[faceIdx].tri_vertex_coord[0 + (triIndex * 9)];
        // y1
        pointValues[allTriLength * 9 + 1] = jsondata.face_list[faceIdx].tri_vertex_coord[1 + (triIndex * 9)];
        // z1
        pointValues[allTriLength * 9 + 2] = jsondata.face_list[faceIdx].tri_vertex_coord[2 + (triIndex * 9)];
        // x2
        pointValues[allTriLength * 9 + 3] = jsondata.face_list[faceIdx].tri_vertex_coord[3 + (triIndex * 9)];
        // y2
        pointValues[allTriLength * 9 + 4] = jsondata.face_list[faceIdx].tri_vertex_coord[4 + (triIndex * 9)];
        // z2
        pointValues[allTriLength * 9 + 5] = jsondata.face_list[faceIdx].tri_vertex_coord[5 + (triIndex * 9)];
        // x3
        pointValues[allTriLength * 9 + 6] = jsondata.face_list[faceIdx].tri_vertex_coord[6 + (triIndex * 9)];
        // y3
        pointValues[allTriLength * 9 + 7] = jsondata.face_list[faceIdx].tri_vertex_coord[7 + (triIndex * 9)];
        // z3
        pointValues[allTriLength * 9 + 8] = jsondata.face_list[faceIdx].tri_vertex_coord[8 + (triIndex * 9)];
        // 计算三角面的面法向量
        let normalValue = getNormal(pointValues[allTriLength * 9 + 0],
                                    pointValues[allTriLength * 9 + 1],
                                    pointValues[allTriLength * 9 + 2],
                                    pointValues[allTriLength * 9 + 3],
                                    pointValues[allTriLength * 9 + 4],
                                    pointValues[allTriLength * 9 + 5],
                                    pointValues[allTriLength * 9 + 6],
                                    pointValues[allTriLength * 9 + 7],
                                    pointValues[allTriLength * 9 + 8]);
        normalValues[allTriLength * 3 + 0] = normalValue[0];
        normalValues[allTriLength * 3 + 1] = normalValue[1];
        normalValues[allTriLength * 3 + 2] = normalValue[2];
        // 这里的3代表的是3个一组
        cellValues[cellOffset++] = 3;
        cellValues[cellOffset++] = allTriLength * 3 + 0;
        cellValues[cellOffset++] = allTriLength * 3 + 1;
        cellValues[cellOffset++] = allTriLength * 3 + 2;
        // allTriLength记录计算到第几个三角面
        allTriLength++;
        cellDataValues[allTriLength] = 0;
        // 将三角形点及坐标加入到Polydata数据中
        polydata.getPoints().setPoint(0, pointValues[allTriLength * 9 + 0], pointValues[allTriLength * 9 + 1], pointValues[allTriLength * 9 + 2]);
        polydata.getPoints().setPoint(1, pointValues[allTriLength * 9 + 3], pointValues[allTriLength * 9 + 4], pointValues[allTriLength * 9 + 5]);
        polydata.getPoints().setPoint(2, pointValues[allTriLength * 9 + 6], pointValues[allTriLength * 9 + 7], pointValues[allTriLength * 9 + 8]);
        // 将Cell点及坐标加入到Polydata数据中
        polydata.getPolys().setData(cellValues);
        console.log("polydata.getPolys()::",polydata.getPolys());
      }
    } // Rotate points



    //  -------------------测试部分-------------------

    //  let numTriangles = jsondata.nbFaces;
    //  var pointValues = new Float32Array(numTriangles * 9);
    //  var normalValues = new Float32Array(numTriangles * 3);
    //  var cellValues = new Uint32Array(numTriangles * 4);
    //  var cellDataValues = new Uint16Array(numTriangles);
    //  var cellOffset = 0;
    // for (var faceIdx = 0; faceIdx < numTriangles; faceIdx++) {
    //   pointValues[faceIdx * 9 + 0] = jsondata.pointValues[faceIdx * 9 + 0];
    //   pointValues[faceIdx * 9 + 1] = jsondata.pointValues[faceIdx * 9 + 1];
    //   pointValues[faceIdx * 9 + 2] = jsondata.pointValues[faceIdx * 9 + 2];
    //   pointValues[faceIdx * 9 + 3] = jsondata.pointValues[faceIdx * 9 + 3];
    //   pointValues[faceIdx * 9 + 4] = jsondata.pointValues[faceIdx * 9 + 4];
    //   pointValues[faceIdx * 9 + 5] = jsondata.pointValues[faceIdx * 9 + 5];
    //   pointValues[faceIdx * 9 + 6] = jsondata.pointValues[faceIdx * 9 + 6];
    //   pointValues[faceIdx * 9 + 7] = jsondata.pointValues[faceIdx * 9 + 7];
    //   pointValues[faceIdx * 9 + 8] = jsondata.pointValues[faceIdx * 9 + 8];
    //   let normalValue = getNormal(pointValues[faceIdx * 9 + 0],
    //                                     pointValues[faceIdx * 9 + 1],
    //                                     pointValues[faceIdx * 9 + 2],
    //                                     pointValues[faceIdx * 9 + 3],
    //                                     pointValues[faceIdx * 9 + 4],
    //                                     pointValues[faceIdx * 9 + 5],
    //                                     pointValues[faceIdx * 9 + 6],
    //                                     pointValues[faceIdx * 9 + 7],
    //                                     pointValues[faceIdx * 9 + 8]);
    //         normalValues[faceIdx * 3 + 0] = normalValue[0];
    //         normalValues[faceIdx * 3 + 1] = normalValue[1];
    //         normalValues[faceIdx * 3 + 2] = normalValue[2];
    //   cellValues[cellOffset++] = 3;
    //   cellValues[cellOffset++] = faceIdx * 3 + 0;
    //   cellValues[cellOffset++] = faceIdx * 3 + 1;
    //   cellValues[cellOffset++] = faceIdx * 3 + 2;
    //   cellDataValues[faceIdx] = 8224;
    // } // Rotate points
    // ----------------------------------------------------


    console.log("JOSN-numTriangles:::",numTriangles);
    console.log("JOSN-pointValues:::",pointValues);
    console.log("JOSN-normalValues:::",normalValues);
    console.log("JOSN-cellValues:::",cellValues);
    console.log("JOSN-cellDataValues:::",cellDataValues);

    // console.log("polydata.getPoints()::",polydata.getPoints());
    polydata.getPoints().setData(pointValues, 3);
    // console.log("polydata.getPolys()::",polydata.getPolys());
    polydata.getPolys().setData(cellValues);
    // console.log("polydata.getCellData()::",polydata.getCellData());
    // polydata.getCellData().setScalars(vtkDataArray.newInstance({
    //   name: 'Attribute',
    //   values: cellDataValues
    // }));
    // polydata.getCellData().setNormals(vtkDataArray.newInstance({
    //   name: 'Normals',
    //   values: normalValues,
    //   numberOfComponents: 3
    // })); // Add new output
    // console.log("polydata::",polydata.getPointData().get());
    model.output[0] = polydata;
  } 

  publicAPI.setUrl = function (url) {
    var option = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      binary: true
    };
    model.url = url; // Remove the file in the URL

    var path = url.split('/');
    path.pop();
    model.baseURL = path.join('/'); // Fetch metadata

    return publicAPI.loadData(option);
  }; // Fetch the actual data arrays


  publicAPI.loadData = function () {
    var option = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = function (content) {
    if (typeof content === 'string') {
      publicAPI.parseAsText(content);
    } else {
      publicAPI.parseAsArrayBuffer(content);
    }
  };

  publicAPI.parseAsArrayBuffer = function (content) {
    // content是二进制化文件
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content; // ascii/binary detection

    var isBinary = false; // 80=STL header, 4=uint32 of num of triangles (le)
    // 80+4它代表字节数组中的元素数
    
    console.log("content::",content);

    var dview = new DataView(content, 0, 80 + 4);
    // 用于在指定位置获取无符号 32 位整数==>得出三角形数量
    var numTriangles = dview.getUint32(80, true); // 50 bytes per triangle
    console.log("numTriangles:::",numTriangles);
    isBinary = 84 + numTriangles * 50 === content.byteLength; // Check if ascii format

    if (!isBinary) {
      publicAPI.parseAsText(BinaryHelper.arrayBufferToString(content));
      return;
    } // Binary parsing
    // Header

// 检验合格解析头文件
    var headerData = content.slice(0, 80);
    var headerStr = BinaryHelper.arrayBufferToString(headerData);
    var header = parseHeader(headerStr); // Data

    var dataView = new DataView(content, 84); // global.dataview = dataView;

    var nbFaces = (content.byteLength - 84) / 50;//三角面的数量
    console.log(nbFaces === numTriangles);
    // 浮点型数组==>超出长度的值不进行显示
    // 面数*(3*3) = 顶点数
    var pointValues = new Float32Array(nbFaces * 9);
    // 面数*(3*1) = 法向量
    var normalValues = new Float32Array(nbFaces * 3);
    // 单元
    var cellValues = new Uint32Array(nbFaces * 4);
    var cellDataValues = new Uint16Array(nbFaces);
    var cellOffset = 0;
// 对法线，点还有单元面进行设置
    for (var faceIdx = 0; faceIdx < nbFaces; faceIdx++) {
      var offset = faceIdx * 50;
      // normalValues[faceIdx * 3 + 0] = dataView.getFloat32(offset + 0, true);
      // normalValues[faceIdx * 3 + 1] = dataView.getFloat32(offset + 4, true);
      // normalValues[faceIdx * 3 + 2] = dataView.getFloat32(offset + 8, true);
      pointValues[faceIdx * 9 + 0] = dataView.getFloat32(offset + 12, true);
      pointValues[faceIdx * 9 + 1] = dataView.getFloat32(offset + 16, true);
      pointValues[faceIdx * 9 + 2] = dataView.getFloat32(offset + 20, true);
      pointValues[faceIdx * 9 + 3] = dataView.getFloat32(offset + 24, true);
      pointValues[faceIdx * 9 + 4] = dataView.getFloat32(offset + 28, true);
      pointValues[faceIdx * 9 + 5] = dataView.getFloat32(offset + 32, true);
      pointValues[faceIdx * 9 + 6] = dataView.getFloat32(offset + 36, true);
      pointValues[faceIdx * 9 + 7] = dataView.getFloat32(offset + 40, true);
      pointValues[faceIdx * 9 + 8] = dataView.getFloat32(offset + 44, true);
      let normalValue = getNormal(pointValues[faceIdx * 9 + 0],
        pointValues[faceIdx * 9 + 1],
        pointValues[faceIdx * 9 + 2],
        pointValues[faceIdx * 9 + 3],
        pointValues[faceIdx * 9 + 4],
        pointValues[faceIdx * 9 + 5],
        pointValues[faceIdx * 9 + 6],
        pointValues[faceIdx * 9 + 7],
        pointValues[faceIdx * 9 + 8]);
        normalValues[faceIdx * 3 + 0] = normalValue[0];
        normalValues[faceIdx * 3 + 1] = normalValue[1];
        normalValues[faceIdx * 3 + 2] = normalValue[2];
      cellValues[cellOffset++] = 3;
      cellValues[cellOffset++] = faceIdx * 3 + 0;
      cellValues[cellOffset++] = faceIdx * 3 + 1;
      cellValues[cellOffset++] = faceIdx * 3 + 2;
      cellDataValues[faceIdx] = dataView.getUint16(offset + 48, true);
    } // Rotate points
    console.log("nbFaces:::",nbFaces);
    console.log("pointValues:::",pointValues);
    console.log("normalValues:::",normalValues);
    console.log("cellValues:::",cellValues);
    console.log("cellDataValues:::",cellDataValues);

    var orientationField = 'SPACE';

    if (orientationField in header && header[orientationField] !== 'LPS') {
      var XYZ = header[orientationField];
      var mat4 = new Float32Array(16);
      mat4[15] = 1;

      switch (XYZ[0]) {
        case 'L':
          mat4[0] = 1;
          break;

        case 'R':
          mat4[0] = -1;
          break;

        default:
          vtkErrorMacro("Can not convert STL file from ".concat(XYZ, " to LPS space: ") + "permutations not supported. Use itk.js STL reader instead.");
          return;
      }

      switch (XYZ[1]) {
        case 'P':
          mat4[5] = 1;
          break;

        case 'A':
          mat4[5] = -1;
          break;

        default:
          vtkErrorMacro("Can not convert STL file from ".concat(XYZ, " to LPS space: ") + "permutations not supported. Use itk.js STL reader instead.");
          return;
      }

      switch (XYZ[2]) {
        case 'S':
          mat4[10] = 1;
          break;

        case 'I':
          mat4[10] = -1;
          break;

        default:
          vtkErrorMacro("Can not convert STL file from ".concat(XYZ, " to LPS space: ") + "permutations not supported. Use itk.js STL reader instead.");
          return;
      }

      vtkMatrixBuilder.buildFromDegree().setMatrix(mat4).apply(pointValues).apply(normalValues);
    }

    var polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(pointValues, 3);
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

    model.output[0] = polydata;
  };

  publicAPI.parseAsText = function (content) {
    if (!content) {
      return;
    }

    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;
    var lines = content.split('\n');
    var offset = 1;
    var points = [];
    var cellArray = [];
    var cellNormals = [];

    while (offset !== -1) {
      offset = readTriangle(lines, offset, points, cellArray, cellNormals);
    }

    var polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(Float32Array.from(points), 3);
    polydata.getPolys().setData(Uint32Array.from(cellArray));
    polydata.getCellData().setNormals(vtkDataArray.newInstance({
      name: 'Normals',
      values: Float32Array.from(cellNormals),
      numberOfComponents: 3
    })); // Add new output

    model.output[0] = polydata;
  };

  publicAPI.requestData = function (inData, outData) {
    publicAPI.parse(model.parseData);
  };
} // ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------


var DEFAULT_VALUES = {// baseURL: null,
  // dataAccessHelper: null,
  // url: null,
}; // ----------------------------------------------------------------------------

function extend(publicAPI, model) {
  var initialValues = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  Object.assign(model, DEFAULT_VALUES, initialValues); // Build VTK API

  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1); // vtkSTLReader methods

  vtkSTLReader(publicAPI, model); // To support destructuring

  if (!model.compression) {
    model.compression = null;
  }

  if (!model.progressCallback) {
    model.progressCallback = null;
  }
} // ----------------------------------------------------------------------------

var newInstance = macro.newInstance(extend, 'vtkSTLReader'); // ----------------------------------------------------------------------------

var vtkSTLReader$1 = {
  extend: extend,
  newInstance: newInstance
};

export { vtkSTLReader$1 as default, extend, newInstance };
