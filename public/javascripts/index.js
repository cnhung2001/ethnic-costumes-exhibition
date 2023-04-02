import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js"

const canvas = document.querySelector(".webgl")
const scene = new THREE.Scene()

const renderer = new THREE.WebGL1Renderer({
  canvas: canvas,
  antialias: true,
})

scene.background = new THREE.Color(0xdddddd)

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.gammaOutput = true

const loader = new GLTFLoader()

const loadAsync = (url) => {
  return new Promise((resolve) => {
    loader.load(url, (gltf) => {
      resolve(gltf)
    })
  })
}

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function onMouseMove(event) {
  // Lấy tọa độ chuột
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function onClick() {
  // Kiểm tra xem chuột có đang nhấp vào bất kỳ vật thể nào không
  raycaster.setFromCamera(mouse, camera)
  const intersects = raycaster.intersectObjects(scene.children, true)

  if (intersects.length > 0) {
    // Nếu có, in ra tên đối tượng đó
    const object = intersects[0].object.parent
    if (object.name.length === 1) {
      console.log(object.name)
      window.location.href = "/room?id=" + object.name
    }
  }
}

window.addEventListener("mousemove", onMouseMove, false)
window.addEventListener("click", onClick, false)

function loadPosition() {
  fetch("/rooms")
    .then((response) => response.json())
    .then((data) => {
      for (let i = 0; i < data.length; i++) {
        Promise.all([loadAsync("public/assets/model/house.glb")]).then(
          (models) => {
            const newHouse = models[0].scene.children[0]
            const item = data[i]
            newHouse.position.set(item.x, item.y, item.z)
            newHouse.name = item.RID.toString()
            scene.add(newHouse)
          }
        )
      }
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
// const light1 = new THREE.DirectionalLight(0xffffff, 1)
// light1.position.set(0, 20, 0)
// scene.add(light1)

// const light2 = new THREE.DirectionalLight(0xffffff, 5)
// light.position.set(0, 5, 5)
// scene.add(light2)

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({
//   color: 0x00ff00,
// });
// const boxMesh = new THREE.Mesh(geometry, material);
// scene.add(boxMesh);

const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  1000
)

document.body.appendChild(renderer.domElement)

renderer.setSize(window.innerWidth, window.innerHeight)

camera.position.set(50, 50, 0)
//camera.lookAt(0, 30, 50)
scene.add(camera)

const controls = new OrbitControls(camera, renderer.domElement)
controls.addEventListener("change", render)

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
}
document.addEventListener("keydown", handleKeyDown)

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  // renderer.render(scene, camera)

  render()
}

function render() {
  renderer.render(scene, camera)
}

animate()
