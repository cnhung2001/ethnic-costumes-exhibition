import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js"

import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js"
import { Sky } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Sky.js"
import datGui from "https://cdn.skypack.dev/dat.gui"

import { Vector3 } from "https://cdn.skypack.dev/three"

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
scene.background = new THREE.Color("skyblue")

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.gammaOutput = true

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
)

let sky, sun
sky = new Sky()
sky.scale.setScalar(450000)
scene.add(sky)

sun = new THREE.Vector3()
const effectController = {
  turbidity: 10,
  rayleigh: 2.5,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.5,
  elevation: 1.5,
  azimuth: -90,
  exposure: 1,
}

function guiChanged() {
  const uniforms = sky.material.uniforms
  uniforms["turbidity"].value = effectController.turbidity
  uniforms["rayleigh"].value = effectController.rayleigh
  uniforms["mieCoefficient"].value = effectController.mieCoefficient
  uniforms["mieDirectionalG"].value = effectController.mieDirectionalG

  const phi = THREE.MathUtils.degToRad(90 - effectController.elevation)
  const theta = THREE.MathUtils.degToRad(effectController.azimuth)

  sun.setFromSphericalCoords(1, phi, theta)

  uniforms["sunPosition"].value.copy(sun)

  renderer.toneMappingExposure = effectController.exposure
  renderer.render(scene, camera)
}

// const gui = new datGui.GUI()

// gui.add(effectController, "turbidity", 0.0, 20.0, 0.1).onChange(guiChanged)
// gui.add(effectController, "rayleigh", 0.0, 4, 0.001).onChange(guiChanged)
// gui
//   .add(effectController, "mieCoefficient", 0.0, 0.1, 0.001)
//   .onChange(guiChanged)
// gui.add(effectController, "mieDirectionalG", 0.0, 1, 0.001).onChange(guiChanged)
// gui.add(effectController, "elevation", 0, 90, 0.1).onChange(guiChanged)
// gui.add(effectController, "azimuth", -180, 180, 0.1).onChange(guiChanged)
// gui.add(effectController, "exposure", 0, 1, 0.0001).onChange(guiChanged)

guiChanged()

const loadingManager = new THREE.LoadingManager()

const loader = new GLTFLoader(loadingManager)
const loaderFont = new THREE.FontLoader()

// loadingManager.onStart = function (url, iteam, total) {
//   console.log(`Started loading ${url}`)
// }

// const progressBar = document.getElementById("progress-bar")

// loadingManager.onProgress = function (url, loaded, total) {
//   progressBar.value = (loaded / total) * 100
// }

// const progressBarContainer = document.querySelector(".progress-bar-container")

// loadingManager.onLoad = function () {
//   progressBarContainer.style.display = "none"
// }

const loadAsync = (url) => {
  return new Promise((resolve) => {
    loader.load(url, (gltf) => {
      resolve(gltf)
    })
  })
}

const objects = []

function loadPosition() {
  fetch("/rooms")
    .then((response) => response.json())
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        Promise.all([loadAsync(item.Dpath)]).then((models) => {
          const newHouse = models[0].scene.children[0]
          newHouse.position.set(item.x, item.y, item.z)
          newHouse.name = item.RID.toString()
          scene.add(newHouse)
          //const box = new THREE.Box3().setFromObject(newHouse)
          //scene.add(box)
          //console.log(box.min)
          var helper = new THREE.BoxHelper(newHouse)
          helper.visible = false
          helper.update()
          // If you want a visible bounding box
          scene.add(helper)
          objects.push({
            model: newHouse,
            boxHelper: helper,
          })

          //load name house
          loaderFont.load(
            "public/assets/font/Open_Sans_Bold.json",
            function (font) {
              const geometry = new THREE.TextGeometry(item.name, {
                font: font,
                size: 1,
                height: 0.2,
                curveSegments: 10,
                bevelEnabled: false,
                bevelOffset: 0,
                bevelSegments: 1,
                bevelSize: 0.3,
                bevelThickness: 1,
              })
              const materials = [
                new THREE.MeshPhongMaterial({ color: "rgb(255, 51, 51)" }), // front
                new THREE.MeshPhongMaterial({ color: 0x540722 }), // side
              ]
              const textMesh3 = new THREE.Mesh(geometry, materials)
              textMesh3.castShadow = true
              textMesh3.position.x = item.x + 9
              textMesh3.position.y = item.y + 1
              textMesh3.position.z = item.z + 6
              textMesh3.rotation.y = 1.57

              scene.add(textMesh3)
            }
          )
        })
      }
    })
    .catch((error) => console.error(error))

  fetch("/users")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((user) => {
        console.log(user)
      })
    })

    .catch((error) => console.error(error))
}

loadPosition()

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener("dblclick", (event) => {
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
    // console.log("Clicked on object: ", selectedModel)
    window.location.href = "/room?id=" + selectedModel.name
  }
})

// thêm lưới nền
// const gridHelper = new THREE.GridHelper(1000, 100)
// scene.add(gridHelper)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(20, 10, 30)
light.lookAt(0, 0, 0)
scene.add(light)
const light1 = new THREE.DirectionalLight(0xffffff, 0.5)
light1.position.set(0, 10, -20)
scene.add(light1)

// const light2 = new THREE.DirectionalLight(0xffffff, 5)
// light.position.set(0, 5, 5)
// scene.add(light2)

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
// });
// const boxMesh = new THREE.Mesh(geometry, material);
// scene.add(boxMesh);

document.body.appendChild(renderer.domElement)

renderer.setSize(window.innerWidth, window.innerHeight)

camera.position.set(20, 5, 0)
//camera.lookAt(0, 30, 50)
scene.add(camera)

const controls = new OrbitControls(camera, renderer.domElement)
controls.addEventListener("change", render)

// const geometry = new THREE.BoxGeometry(1, 1, 1)
// const material = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
// })

// const cube = new THREE.Mesh(geometry, material)
// scene.add(cube)
// cube.position.set(15, 0, 0)

// If you just want the numbers
// console.log(helper.box.min)
// console.log(helper.box.max)

// const tControl = new TransformControls(camera, renderer.domElement)

// tControl.addEventListener("dragging-changed", (e) => {
//   orbit.enabled = !e.value
// })

// tControl.attach(cube)
// scene.add(tControl)
// tControl.setMode("translate")

window.addEventListener("resize", onWindowResize, false)
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  render()
}

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
}
document.addEventListener("keydown", handleKeyDown)

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  // renderer.render(scene, camera)
  //controls1.update()

  render()
}

function render() {
  renderer.render(scene, camera)
}

animate()
