import * as THREE from './three.js/build/three.module.js';

import Stats from './three.js/examples/jsm/libs/stats.module.js';

import { OrbitControls } from './three.js/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from './three.js/examples/jsm/environments/RoomEnvironment.js';
import { OBJLoader } from './three.js/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from './three.js/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from './three.js/examples/jsm/loaders/DRACOLoader.js';
import {Vector3} from "./three.js/src/math/Vector3.js";
import {MTLLoader} from "./three.js/examples/jsm/loaders/MTLLoader.js";

let mixer;

const clock = new THREE.Clock();
const container = document.getElementById( 'container' );

const stats = new Stats();
container.appendChild( stats.dom );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild( renderer.domElement );

const pmremGenerator = new THREE.PMREMGenerator( renderer );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfe3dd );
scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 100 );
camera.position.set(10,10,20 );
camera.lookAt(0,0,0);

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = true;
controls.enableDamping = true;

// 调试用坐标轴
let axes = new THREE.AxesHelper(20);
// scene.add(axes);

//初始化顶点集合，顶点数值，数据结构体
let vertices = [];
let values = [];
let loadedData = [];

//通过 光线投射Raycaster计算得到的 焦点数据
let INTERSECTED;
let raycaster = new THREE.Raycaster();

//鼠标位置
let pointer = new THREE.Vector2();


//选中的部分

document.addEventListener('click', onPointerMove);
document.addEventListener('keypress', kbdHandler);

let mesh = new THREE.Mesh();
let highlightFace ;
let highlightMtl;
let geometry = new THREE.BufferGeometry();
let loadedMesh ;
let meshMask = []  ;
let sceneDB=[];
let uuid_list = {} ;
/**
 * 读取json 文件， 需要把data.json修改为动态加载
 //  */
// readTextFile("./data.json", function(text){
//     loadedData = JSON.parse(text);
//     console.log(loadedData);
//     console.log("Loaded " + (loadedData["infoList"].length).toString() +" sets of data" );
//     const showResult = loadedData["infoList"][0]
//     for( let x = 0 ; x < showResult["resultsList"].length ; x++){
//         vertices.push(new THREE.Vector3(showResult["resultsList"][x]["locationX"],
//             showResult["resultsList"][x]["locationY"],
//             showResult["resultsList"][x]["locationZ"]));
//         values.push(showResult["resultsList"][x]["value"])
//     }
//     let positions = [];
//     let colors = [];
//     let min = Math.min.apply(null, values);
//     let max = Math.max.apply(null, values);
//     console.log(min,max);
//     for (let i = 0 ; i < vertices.length ; i++){
//         positions.push(vertices[i].x, vertices[i].y , vertices[i].z);
//         let color = getColor(values[i],min,max );
//         colors.push(color[0], color[1], color[2]);
//     }
//     geometry = new THREE.BufferGeometry();
//     geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
//     geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
//     geometry.setIndex([0,1,2,1,2,3]);
//     const material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors , side:THREE.DoubleSide});
//     const highlightMaterial  = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
//     var materials = [] ;
//     materials.push(material);
//     // materials.push(null);
//     materials.push(highlightMaterial);
//     console.log(materials);
//
//     console.log(geometry);
//     for (let i = 0 ; i < geometry.index.array.length  ;  i+=3){
//         geometry.addGroup(i,i+3,0);
//     }
//     geometry.groups.forEach(function (face) {
//         face.materialIndex = 0; // 初始化为没有选中
//     });
//     mesh = new THREE.Mesh(geometry, materials);
//     scene.add(mesh);
//     console.log(mesh);
// });




readTextFile('/3dv/jason.obj', function(text){
    // console.log(text);
    const objLoader = new OBJLoader();
    const loaded = objLoader.parse(text);
    console.log(loaded.children);
    loadedMesh = loaded.children;
    for (let i = 0 ; i < loaded.children.length ; i++) {
        const listDOM = document.getElementById('switch');
        const item = document.createElement("div");
        item.textContent = loadedMesh[i].name;
        item.id = "Mesh_" + i.toString();
        item.className = "listItem";
        item.title = item.textContent;
        item.onclick = function (){
            changeOnOff(item.id);
        };
        listDOM.appendChild(item)
        meshMask.push(true);
    }
    onMeshChange();

});
// const objLoader = new OBJLoader();
// objLoader.setMaterials(material);
// objLoader.load('/jason.obj', function(object){
//     scene.add(object);
//     console.log("loaded");
//     console.log(objLoader);
// });


animate();
//
// renderer.render(scene,camera);
//


// const dracoLoader = new DRACOLoader();
// dracoLoader.setDecoderPath( 'js/libs/draco/gltf/' );
//
// const loader = new GLTFLoader();
// loader.setDRACOLoader( dracoLoader );
// loader.load( './three.js/examples/models/gltf/LittlestTokyo.glb', function ( gltf ) {
//
// 	const model = gltf.scene;
// 	model.position.set( 1, 1, 0 );
// 	model.scale.set( 0.01, 0.01, 0.01 );
// 	scene.add( model );
//
// 	mixer = new THREE.AnimationMixer( model );
// 	mixer.clipAction( gltf.animations[ 0 ] ).play();
//
// 	animate();
//
// }, undefined, function ( e ) {
//
// 	console.error( e );
//
// } );
//



window.onresize = function () {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

};


function animate() {

    requestAnimationFrame( animate );

    const delta = clock.getDelta();

    controls.update();

    stats.update();


    renderer.render( scene, camera );


}

function readTextFile(file, callback){
    let rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function (){
        if (rawFile.readyState === 4  && rawFile.status === 200){
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

function getColor(value, min ,max){
    let relativeValue = (value-min) / (max-min);
    // 映射颜色 1 -> 红色， 0.5 -> 绿色， 0->蓝色
    let red, green, blue;
    if (relativeValue > 0.5){
        red = (relativeValue - 0.5) / 0.5;
        blue = 0 ;
        green = (1-relativeValue) / 0.5;
    }else{
        blue = -(relativeValue - 0.5) / 0.5;
        red = 0 ;
        green = (relativeValue) / 0.5;
    }
    // console.log([red, green, blue]);
    return [red, green, blue];
}

function onPointerMove(event){
    pointer.x = (event.clientX / window.innerWidth ) * 2 - 1;
    // pointer.x = event.clientX ;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    // pointer.y = event.clientY ;
    // console.log("get x = " + pointer.x.toString() + "  y = " + pointer.y.toString());
    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(scene.children);
    // console.log(intersects[0].object);
    // if (intersects.length > 0 ){
    // 	let highlight = new THREE.MeshBasicMaterial({color: 'green',side:THREE.DoubleSide});
    // 	let obj = intersects[0];
    // 	console.log(obj);
    // 	// let indexes = obj.object.geometry.index.array;
    // 	console.log(obj.object.material);
    // 	obj.object.material = highlight;
    //
    // }
    // scene.remove(mesh);
    // const material = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors , side:THREE.DoubleSide});
    // mesh = new THREE.Mesh(geometry, material);
    // scene.add(mesh)；
    if (intersects.length > 0 ){
        let obj = intersects[0].object ;
        // console.log(intersects[0])
        console.log(uuid_list[intersects[0].object.uuid]);
        let faceIndex = uuid_list[intersects[0].object.uuid];
        if (highlightFace !== faceIndex){
            // highlightFace = faceIndex;
            addHighlight(faceIndex);
        }
    }else{
        removeHighlight();
    }
    renderer.render(scene , camera)
}

function addHighlight( faceIndex){
    if (highlightFace !== null){
        removeHighlight();
    }

    /*
    const highlightMaterial  = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
    highlightObj = obj;
    highlightMtl = obj.material;
    obj.material = highlightMaterial;
    */
    highlightFace = faceIndex;
    // console.log(obj.face);
    // obj.object.geometry.groups[obj.faceIndex].materialIndex = 1;
    // obj.object.geometry.groupsNeedUpdate = true;
    // obj.object.material.needsUpdate = true;
    let domItem = document.getElementById('Mesh_'+faceIndex.toString());
    domItem.className = 'HLTItem';
}

function removeHighlight(){
    if (highlightFace != null){
        console.log(highlightFace);
        // geometry.groups[highlightFace].materialIndex = 0;
        let domItem = document.getElementById('Mesh_'+highlightFace.toString());
        domItem.className = 'listItem';
    }
    highlightFace = null ;
    highlightMtl = null ;
}

function changeOnOff(id){
    id = parseInt(id.replace(/[^0-9]/ig,""));
    console.log(id);
    meshMask[id] = !meshMask[id];
    if(meshMask[id]){
        scene.add(sceneDB[id]);
    }else{
        scene.remove(sceneDB[id]);
    }
}

function onMeshChange(){
    while(sceneDB.length){
        scene.remove(sceneDB[0]);
        sceneDB.pop();
    }
    for(let index = 0 ; index < loadedMesh.length ; index++) {
        console.log(meshMask);
        if (!meshMask[index]) continue;
        const thisMesh = loadedMesh[index];
        const loadedGeometry = thisMesh.geometry;
        const vertexNumber = loadedGeometry.attributes.position.count;
        console.log(vertexNumber);
        readTextFile('/3dv/test.json', function (text) {
            const values = JSON.parse(text);
            let colorsList = [];
            console.log(values['results'][0]['values']);
            for (let i = 0; i < vertexNumber; i++) {
                let tempColor = getColor(values['results'][0]['values'][Math.floor(Math.random() * vertexNumber)], -100, 100);
                colorsList.push(tempColor[0], tempColor[1], tempColor[2]);
            }
            console.log(colorsList);
            loadedGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsList, 3))
            const loadedMaterial = new THREE.MeshBasicMaterial({vertexColors: THREE.VertexColors});
            const newMesh = new THREE.Mesh(loadedGeometry, loadedMaterial);
            console.log(newMesh);
            sceneDB.push(newMesh);
            scene.add(newMesh);
            uuid_list[newMesh.uuid] = index;
        })
    }
}

function kbdHandler(e){
    onMeshChange() ;
}