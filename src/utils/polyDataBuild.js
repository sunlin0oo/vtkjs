// 引入颜色模式，标量模式
// 法向量
// function getNormal(x1, y1, z1, x2, y2, z2, x3, y3, z3) {
//   const v1 = [x1, y1, z1];
//   const v2 = [x2, y2, z2];
//   const v3 = [x3, y3, z3];
//   const triNormal = [];
//   vtkTriangle.computeNormal(v1, v2, v3, triNormal);
//   return triNormal;
// }

// 扁平化处理
export function flatten(input) {
  if (input.length === 0) return input;
  return input
    .toString()
    .split(',')
    .map((item) => +item);
}

// 二分法搜索---仅适合顺序排列
export function binarySearch(arr, elem) {
  let start = 0;
  let end = arr.length - 1;
  let middle = Math.floor((start + end) / 2);
  while (arr[middle] !== elem && start <= end) {
    if (elem < arr[middle]) {
      end = middle - 1;
    } else {
      start = middle + 1;
    }
    middle = Math.floor((start + end) / 2);
  }
  return middle;
}

// 统计不重复顶点坐标
const CountNonRepeatingVertices = (faceLen, face) => {
  const allFaceVertex = [];
  // 用于统计面的所有顶点
  for (let i = 0; i < faceLen; i++) {
    const vertexLen = face[i].vertex_coord.length / 3;
    const vertexList = face[i].vertex_coord;
    for (let j = 0; j < vertexLen; j++) {
      const vertex = new Array(3);
      vertex[0] = vertexList[j * 3];
      vertex[1] = vertexList[j * 3 + 1];
      vertex[2] = vertexList[j * 3 + 2];
      allFaceVertex.push(vertex);
    }
  }

  // add(szf):进行三角剖分后顶点去重工作
  const vertexOfFace = {};
  allFaceVertex.forEach((item) => {
    vertexOfFace[item] = item;
  });
  return Object.values(vertexOfFace);
};

const CountSolidNumber = (solidLen, solid) => {
  const solidOfFace = [];
  for (let i = 0; i < solidLen; i++) {
    solidOfFace.push(solid[i].face_start_index);
    solidOfFace.push(solid[i].face_end_index);
  }
  return solidOfFace;
};

export function BuildPolyData(jsonData) {
  // 判断jsonData是否存在
  if (!jsonData) {
    return null;
  }
  // 兼容旧数据，查看jsonData中关键字段是否存在
  if (!jsonData.allFaceVertex) {
    let edgeList;
    let faceList;
    // 用于记录不重复的模型顶点
    let allFaceVertex = [];
    let solidOfFace = [];
    // 旧数据中面的数量;
    const faceLen = jsonData.face_list.length;
    const solidLen = jsonData.solid_list.length;
    // 提前将类进行定义
    const face = jsonData.face_list;
    const solid = jsonData.solid_list;

    allFaceVertex = CountNonRepeatingVertices(faceLen, face);
    const vertexCount = allFaceVertex.length;
    solidOfFace = CountSolidNumber(solidLen, solid);

    const newJsonData = {
      allFaceVertex,
      edgeList,
      faceList,
      solidOfFace,
      vertexCount
    };

    // 获取到线段的长度
    newJsonData.edgeList = jsonData.edge_list;
    newJsonData.faceList = jsonData.face_list;

    jsonData = newJsonData;
  }

  // 获取模型面总数量
  const faceLength = jsonData.faceList.length;
  // 模型三角面总数量
  let numTriangles = 0; // numTriangles === nbFaces
  // 建立坐标Hash表
  const map = new Map();
  jsonData.allFaceVertex.forEach((item, index) => {
    map.set(JSON.stringify(item), index);
  });

  // 三角网格化后坐标扁平化处理
  const allVertex = flatten(jsonData.allFaceVertex);
  // 设置顶点维度
  const numdimesion = allVertex.length;
  // 存储顶点维度
  const pointValues = new Float32Array(numdimesion);
  for (let i = 0; i < allVertex.length; i++) {
    pointValues[i] = allVertex[i];
  }

  // 获取三角面总数量
  for (let i = 0; i < faceLength; i++) {
    numTriangles += jsonData.faceList[i].number_of_triangles;
  }
  // 记录三角形的个数==>用于存储数组位数
  let allTriIndex = 0;
  // 存储Cell 对应C++中trangles
  const cellValues = new Uint32Array(numTriangles * 4);
  const lineValues = new Uint32Array(numdimesion * 5);
  // 单元偏量
  let cellOffset = 0;

  // 存储面中包含哪些三角单元
  const face2Cell = [];

  // 用于暂存顶点列表
  const vertexArray = new Array(3);
  const Face2Coordinate = new Array(faceLength);
  // 获取Poly数据结构
  for (let faceIdx = 0; faceIdx < faceLength; faceIdx++) {
    Face2Coordinate[faceIdx] = jsonData.faceList[faceIdx].vertex_coord;
    // 获取到顶点连接顺序的长度
    const len = jsonData.faceList[faceIdx].number_of_triangles * 3;
    // triIndex代表这个面中的第几个三角形
    const triFace = [];
    /**
     * 获取到三角形中顶点的连接次序
     * ==>遍历三角排序的列表==>jsonData.faceList[faceIdx].tri_indexes[i]获取到的在faceIdx面中的第i个顶点；
     */
    for (let i = 0; i < len; i++) {
      if (i % 3 === 0) {
        cellValues[cellOffset++] = 3;
        triFace.push(allTriIndex);
        allTriIndex++;
      }
      vertexArray[0] =
        jsonData.faceList[faceIdx].vertex_coord[0 + jsonData.faceList[faceIdx].tri_indexes[i] * 3];
      vertexArray[1] =
        jsonData.faceList[faceIdx].vertex_coord[1 + jsonData.faceList[faceIdx].tri_indexes[i] * 3];
      vertexArray[2] =
        jsonData.faceList[faceIdx].vertex_coord[2 + jsonData.faceList[faceIdx].tri_indexes[i] * 3];
      cellValues[cellOffset++] = map.get(JSON.stringify(vertexArray));
    }
    face2Cell.push(triFace);
  }
  // 线段单元对应顶点的索引表
  const lineMap = new Map();
  // 单元偏量
  let lineOffset = 0;
  // 边的总数量
  const edgeListLen = jsonData.edgeList.length;
  // 线段的组成长度
  let curLoop;
  // 获取Line数据结构
  for (let i = 0; i < edgeListLen; i++) {
    const lineArray = [];
    curLoop = jsonData.edgeList[i].vertex_coord.length / 3;
    // 设置线段组的长度
    lineValues[lineOffset++] = curLoop;
    // 遍历线顶点
    for (let a = 0; a < curLoop; a++) {
      vertexArray[0] = jsonData.edgeList[i].vertex_coord[0 + a * 3];
      vertexArray[1] = jsonData.edgeList[i].vertex_coord[1 + a * 3];
      vertexArray[2] = jsonData.edgeList[i].vertex_coord[2 + a * 3];
      const targetVertex = map.get(JSON.stringify(vertexArray));
      lineValues[lineOffset++] = targetVertex;
      lineArray.push(targetVertex);
    }
    lineMap.set(i, lineArray);
  }
  const { solidOfFace, entityNames } = jsonData;
  /**
   * Face2Coordinate: 面对应的三角坐标系==>用于框选
   * entityNames:实体名称==>实体列表的展示
   * solidOfFace:体对应的面==>体的选择
   * face2Cell: 面对应的单元==>面的选择
   * pointValues: 点信息==>用于模型的几何结构
   * cellValues: 单元信息==>用于模型的面拓扑结构
   * lineValues: 线拓扑结构信息==>用于模型的线拓扑结构
   * lineMap: 线索引表==>用于线的选择
   */
  return {
    Face2Coordinate,
    entityNames,
    solidOfFace,
    face2Cell,
    pointValues,
    cellValues,
    lineValues,
    lineMap
  };
}

export function FindReapeatNumber(arr, ele) {
  const len = arr.length;
  for (let i = 0; i < len; i++) {
    // 寻找到目标元素
    if (arr[i] === ele) {
      // 返回目标元素的索引位置
      return i;
    }
  }
  return -1;
}
