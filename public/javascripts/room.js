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
  2000
)

camera.position.set(30, 30, 30)
camera.lookAt(0, 0, 30)
scene.add(camera)
const controls = new OrbitControls(camera, renderer.domElement)

const loaderModel = new GLTFLoader()
const loaderImage = new THREE.TextureLoader()
const loaderText = new THREE.FontLoader()

loaderText.load("public/assets/font/Open_Sans_Bold.json", function (font) {
  const geometry = new THREE.TextGeometry("Tày", {
    font: font,
    size: 3,
    height: 1,
    curveSegments: 10,
    bevelEnabled: false,
    bevelOffset: 0,
    bevelSegments: 1,
    bevelSize: 0.3,
    bevelThickness: 1,
  })
  const materials = [
    new THREE.MeshPhongMaterial({ color: 0xa8325c }), // front
    new THREE.MeshPhongMaterial({ color: 0x540722 }), // side
  ]
  const textMesh2 = new THREE.Mesh(geometry, materials)
  textMesh2.castShadow = true
  textMesh2.position.y += 5
  textMesh2.position.x -= 10
  textMesh2.position.z = 15

  textMesh2.rotation.y = 1.6
  scene.add(textMesh2)
})

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
        //console.log(item.Dtype)
        if (item.Dtype == "model") {
          Promise.all([loadAsync(`public/assets/model/${item.Dpath}`)]).then(
            (model) => {
              //console.log(item.x)
              const newModel = model[0].scene.children[0]
              newModel.position.set(item.x, item.y, item.z)
              newModel.rotation.set(item.rx, item.ry, item.rz)
              newModel.scale.set(item.sx, item.sy, item.sz)
              newModel.name = item.id
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
          // const objectImage = []
          // objectImage.push(
          //   loaderImage.load(`public/assets/image/${item.Dpath}`)
          // )
          // console.log(objectImage[0])
          var material = new THREE.MeshLambertMaterial({
            map: loaderImage.load(`${item.Dpath}`),
          })
          var geometry = new THREE.PlaneGeometry(item.sx, item.sy)
          var mesh = new THREE.Mesh(geometry, material)
          mesh.position.set(item.x, item.y, item.z)
          mesh.rotation.set(item.rx, item.ry, item.rz)
          mesh.scale.set(item.sx, item.sy, item.sz)
          scene.add(mesh)
          mesh.name = item.id
          var helper = new THREE.BoxHelper(mesh)
          scene.add(helper)
          objects.push({
            model: mesh,
            boxHelper: helper,
          })
          helper.update()
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

const overlay = document.querySelector("#overlay")
const popup = document.createElement("div")
popup.innerHTML = "<p></p>"

popup.style.position = "absolute"
popup.style.top = "50%"
popup.style.left = "50%"
popup.style.transform = "translate(-50%, -50%)"
popup.style.backgroundColor = "white"
popup.style.padding = "20px"
overlay.appendChild(popup)

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener("click", (event) => {
  if ((overlay.style.opacity = "1")) {
    overlay.style.opacity = "0"
  }
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
    console.log(selectedModel.userData.name)

    if (selectedModel.userData.name == "taynam02") {
      overlay.style.opacity = "1"
    }
  }
})

// const searchParams = new URLSearchParams(window.location.search)
// const roomId = searchParams.get("id")
console.log(objects)

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

const light2 = new THREE.DirectionalLight(0xffffff, 0.5)
light2.position.set(0, 30, 0)
light2.lookAt(0, 0, 0)
scene.add(light2)

//controls.addEventListener("change", renderer) //error

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.gammaOutput = true

const cameraSpeed = 0.5
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
