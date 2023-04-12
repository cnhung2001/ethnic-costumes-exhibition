import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js"
import datGui from "https://cdn.skypack.dev/dat.gui"
import { TransformControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/TransformControls.js"

var roomId = new URLSearchParams(window.location.search).get("id")

const canvas = document.querySelector(".webgl")
const scene = new THREE.Scene()

const renderer = new THREE.WebGL1Renderer({
  canvas: canvas,
  antialias: true,
})

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
)

camera.position.set(30, 30, 30)
camera.lookAt(0, 0, 30)
scene.add(camera)
const controls = new OrbitControls(camera, renderer.domElement)

const loaderModel = new GLTFLoader()
const loaderImage = new THREE.TextureLoader()

scene.background = new THREE.Color("skyblue")

const loadAsync = (url) => {
  return new Promise((resolve) => {
    loaderModel.load(url, (gltf) => {
      resolve(gltf)
    })
  })
}

// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
// })

// const cube = new THREE.Mesh(geometry, material)
// scene.add(cube)
// cube.position.set(15, 0, 0)

const tControl = new TransformControls(camera, renderer.domElement)

const objects = []

function loadPosition() {
  fetch(`/room-data?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        console.log(item.Dtype)
        if (item.Dtype == "model") {
          Promise.all([loadAsync(`public/assets/model/${item.Dpath}`)]).then(
            (model) => {
              const newModel = model[0].scene.children[0]
              newModel.position.set(item.x, item.y, item.z)
              newModel.rotation.set(item.rx, item.ry, item.rz)
              newModel.scale.set(item.sx, item.sy, item.sz)
              newModel.name = item.Did
              scene.add(newModel)
              var helper = new THREE.BoxHelper(newModel)
              //helper.visible = false
              scene.add(helper)
              objects.push({
                model: newModel,
                boxHelper: helper,
              })
              helper.update()
            }
          )
        } else if (item.Dtype == "image") {
          var material = new THREE.MeshLambertMaterial({
            map: loaderImage.load(`public/assets/image/${item.Dpath}`),
          })
          var geometry = new THREE.PlaneGeometry(10, 10 * 0.75)
          var mesh = new THREE.Mesh(geometry, material)
          mesh.position.set(6, 0, 0)
          scene.add(mesh)
        }
      })
    })
    .catch((error) => console.error(error))
}

loadPosition()

tControl.addEventListener("dragging-changed", (e) => {
  OrbitControls.enabled = !e.value
  for (let i = 0; i < objects.length; i++) {
    let newBoxObject = objects[i].boxHelper
    newBoxObject.update()
  }
})

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(
    objects.map((object) => object.boxHelper)
  )
  if (intersects.length > 0) {
    const selectedObject = objects.find(
      (object) => object.boxHelper === intersects[0].object
    )
    const selectedModel = selectedObject.model
    console.log("Clicked on object: ", selectedModel)
    tControl.attach(selectedModel)
    scene.add(tControl)
    tControl.setMode("translate")
    console.log(selectedModel.position)
  }
})

// const searchParams = new URLSearchParams(window.location.search)
// const roomId = searchParams.get("id")

console.log(typeof roomId)

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    objects.forEach(function (object) {
      const { x, y, z } = object.model.position
      const { x: rx, y: ry, z: rz } = object.model.rotation
      const { x: sx, y: sy, z: sz } = object.model.scale
      const modelId = object.model.name

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/save-data")
      xhr.setRequestHeader("Content-Type", "application/json")
      xhr.onload = function () {
        if (xhr.status === 200) {
          console.log(xhr.responseText)
        }
      }
      xhr.send(
        JSON.stringify({
          roomId: { roomId },
          modelId: { modelId },
          position: { x, y, z },
          rotation: { x: rx, y: ry, z: rz },
          scale: { x: sx, y: sy, z: sz },
        })
      )
    })
  }
})

// thêm lưới nền
// const gridHelper = new THREE.GridHelper(1000, 100)
// scene.add(gridHelper)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(20, 10, 30)
light.lookAt(0, 0, 0)
scene.add(light)

//controls.addEventListener("change", renderer) //error

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.gammaOutput = true

const cameraSpeed = 0.1
function handleKeyDown(event) {
  const code = event.code
  if (code === "ArrowLeft") {
    camera.position.x -= cameraSpeed
  }
  if (code === "ArrowRight") {
    camera.position.x += cameraSpeed
  }
  if (code === "ArrowUp") {
    camera.position.y += cameraSpeed
  }
  if (code === "ArrowDown") {
    camera.position.y -= cameraSpeed
  }
  if (code === "KeyG") {
    controls.enableZoom = !controls.enableZoom
    controls.enableRotate = !controls.enableRotate
    controls.enablePan = !controls.enablePan
  }
  if (code === "KeyR") {
    tControl.setMode("rotate")
  }
  if (code === "KeyS") {
    tControl.setMode("scale")
  }
  if (code === "KeyC") {
    tControl.detach()
  }
  if (code === "Enter") {
  }
}
document.addEventListener("keydown", handleKeyDown)

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener()
camera.add(listener)

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

animate()
