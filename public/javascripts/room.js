import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js"

var roomId = new URLSearchParams(window.location.search).get("id")

const canvas = document.querySelector(".webgl")
const scene = new THREE.Scene()

const renderer = new THREE.WebGL1Renderer({
  canvas: canvas,
})

scene.background = new THREE.Color(0xdddddd)

const loader = new GLTFLoader()

const loadAsync = (url) => {
  return new Promise((resolve) => {
    loader.load(url, (gltf) => {
      resolve(gltf)
    })
  })
}

function loadPosition() {
  fetch(`/room-data?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        loadAsync(`public/assets/model/${item.Dpath}`).then((model) => {
          const newModel = model.scene.children[0]
          newModel.position.set(item.x, item.y, item.z)
          scene.add(newModel)
        })
      })
    })
    .catch((error) => console.error(error))
}

loadPosition()

// thêm lưới nền
const gridHelper = new THREE.GridHelper(1000, 100)
scene.add(gridHelper)

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(20, 10, 30)
light.lookAt(0, 0, 0)
scene.add(light)

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

renderer.antialias = true

const controls = new OrbitControls(camera, renderer.domElement)
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
