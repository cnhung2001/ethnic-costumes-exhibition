import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js"
import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js"
import { TransformControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/TransformControls.js"
import datGui from "https://cdn.skypack.dev/dat.gui"

import { EffectComposer } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/EffectComposer.js"
import { RenderPass } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/postprocessing/RenderPass.js"
import { Sky } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/objects/Sky.js"

var roomId = new URLSearchParams(window.location.search).get("id")
const userInfo = JSON.parse(localStorage.getItem("userInfo"))

if (roomId != 1 && !userInfo) {
  window.location.href = "/login"
}

const canvas = document.querySelector(".webgl")
const scene = new THREE.Scene()

const renderer = new THREE.WebGL1Renderer({
  canvas: canvas,
  antialias: false,
})

const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  1500
)

//set cam default
camera.position.set(200, 50, 200)
camera.aspect = sizes.width / sizes.height
//camera.lookAt(140, 0, 250)
//console.log(camera.position)
scene.add(camera)

//sun
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
  azimuth: 180,
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

  //console.log(theta)
  uniforms["sunPosition"].value.copy(sun)

  renderer.toneMappingExposure = effectController.exposure
  renderer.render(scene, camera)
}

guiChanged()

const controls = new OrbitControls(camera, renderer.domElement)

const loadingManager = new THREE.LoadingManager()

const loaderModel = new GLTFLoader(loadingManager)
const loaderImage = new THREE.TextureLoader(loadingManager)
const loaderText = new THREE.FontLoader(loadingManager)

//loading
const roomCanvas = document.querySelector(".room-container > canvas")

const progressBar = document.getElementById("progress-bar")
const loadingPercent = document.querySelector(".loading-percent")

loadingManager.onProgress = function (url, loaded, total) {
  progressBar.value = (loaded / total) * 100
  loadingPercent.textContent = `${
    Math.round((loaded / total) * 100 * 100) / 100
  }%`
}

const progressBarContainer = document.querySelector(".progress-bar-container")

loadingManager.onLoad = function () {
  progressBarContainer.style.display = "none"
  roomCanvas.style.display = "block"
}

scene.background = new THREE.Color("rgb(138, 193, 170)")

// const fwd = new THREE.Vector3(0, 0, 1)
// fwd.applyMatrix3(camera.matrixWorld).normalize()

// camera.position.set(controls.target).sub(10)
// //controls.update()

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

const overlay = document.querySelector("#overlay")
const popup = document.createElement("div")

var state = true

popup.style.position = "absolute"
popup.style.top = "50%"
popup.style.left = "50%"
popup.style.transform = "translate(-50%, -50%)"
popup.style.backgroundColor = "white"
popup.style.padding = "20px"
popup.style.pointerEvents = "all"
overlay.appendChild(popup)

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
              helper.visible = false
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
          mesh.name = item.Dpath.split("public/assets/image/")[1].split(".")[0]
          mesh.eventType = "image"
          var helper = new THREE.BoxHelper(mesh)
          scene.add(helper)
          objects.push({
            model: mesh,
            boxHelper: helper,
          })
          helper.visible = false

          helper.update()
        } else if (item.Dtype == "text") {
          console.log(item.Dpath)
        }
      })
    })
    .catch((error) => console.error(error))
  fetch(`/IslandHeader?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        //console.log(item)
        loaderText.load(item.fontpath, function (font) {
          const geometry = new THREE.TextGeometry(item.content, {
            font: font,
            size: item.size,
            height: item.height,
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
          textMesh3.position.x = item.x - 12
          textMesh3.position.y = item.y
          textMesh3.position.z = item.z - 7.5

          scene.add(textMesh3)
        })
      })
    })
    .catch((error) => console.error(error))
  fetch(`/comments?id=${roomId}`)
    .then((response) => response.json())
    .then((data) => {
      data.forEach((item) => {
        const nameUser = `<h3>${item.username}</h3>`
        const commentContent = `<p>${item.content}</p>`
        document.getElementById("comment").insertAdjacentHTML(
          "beforeend",
          `<div class="comment-item">
            <div class="comment-item__avatar">
              <img src="/public/assets/image/avatar-placeholder.png" alt="avatar" />
            </div>
            <div class="comment-item__content">
            ${nameUser}
            ${commentContent}
            </div>
          </div>`
        )
      })
    })
    .catch((error) => console.error(error))
}

const commentBtn = document.querySelector(".comment")
commentBtn.addEventListener("click", function () {
  if (state == true) {
    document.querySelector(".comment-container").style.display = "block"
    state = false
  } else if (state == false) {
    document.querySelector(".comment-container").style.display = "none"
    state = true
  }
  console.log(state)
})
// const uidInput = document.querySelector('input[name="uid')
// uidInput.value = userInfo.UID
// const ridInput = document.querySelector('input[name="rid')
// ridInput.value = userInfo.RID

// const ridInputFile = document.querySelector('input[name="ridupload')
// //console.log(ridInputFile.value)
// ridInputFile.value = roomId

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
  if ((overlay.style.opacity = "1")) {
    overlay.style.opacity = "0"
    overlay.style.display = "none"
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

    if (selectedModel.eventType === "image") {
      // controls.enablePan = false
      // controls.enableRotate = false
      // controls.enableZoom = false

      overlay.style.opacity = "1"
      overlay.style.display = "block"
      fetch(`../../assets/data/${selectedModel.name}.html`)
        .then((response) => response.text())
        .then((text) => {
          if (!text?.includes("Cannot")) {
            popup.innerHTML = text
          } else {
            popup.innerHTML = "Khong co du lieu!"
          }
        })
    }

    //console.log("Clicked on object: ", selectedModel)
    tControl.attach(selectedModel)
    scene.add(tControl)
    tControl.setMode("translate")
    tControl.enabled = false
    //console.log(tControl.enabled)
    //console.log(selectedModel.userData.name)
    //console.log(selectedModel.position.x)

    // controls.target.set(
    //   selectedModel.position.x,
    //   selectedModel.position.y,
    //   selectedModel.position.z
    // )
    //camera.lookAt(controls.target)

    // camera.position.set(
    //   selectedModel.position.x,
    //   selectedModel.position.y,
    //   selectedModel.position.z
    // )
    //default
    window.addEventListener("dblclick", (event) => {
      let newX = selectedModel.position.x - 10
      let newY = selectedModel.position.y
      let newZ = selectedModel.position.z - 10
      controls.target.set(newX, newY, newZ)
      console.log("position cũ", camera.position)

      camera.position.set(newX, newY + 5, newZ + 20)

      console.log("target", controls.target)
      console.log("position mới", camera.position)

      controls.update()
    })
  }
})

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

const light3 = new THREE.DirectionalLight(0xffffff, 0.5)
light3.position.set(0, 30, -40)
light3.lookAt(0, 0, 0)
scene.add(light3)

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
    if (userInfo?.role === "admin" || roomId == userInfo?.RID) {
      tControl.enabled = !tControl.enabled
    } else {
      tControl.enabled = false
    }
  }
  // if (code === "KeyC") {
  //   tControl.enabled = true
  // }
}
document.addEventListener("keydown", handleKeyDown)

const listener = new THREE.AudioListener()
camera.add(listener)

const audioLoader = new THREE.AudioLoader()

const backgroundSound = new THREE.Audio(listener)
audioLoader.load("./assets/sound/soundDemo.mp3", function (buffer) {
  backgroundSound.setBuffer(buffer)
  backgroundSound.setLoop(true)
  backgroundSound.setVolume(1)
  backgroundSound.play()
})

const soundBtn = document.querySelector(".sound")
soundBtn.addEventListener("click", function () {
  if (soundBtn.classList.contains("muted")) {
    backgroundSound.play()
    soundBtn.classList.remove("muted")
    soundBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pause" viewBox="0 0 16 16">
    <path d="M6 3.5a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5zm4 0a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4a.5.5 0 0 1 .5-.5z"/>
  </svg>`
  } else {
    backgroundSound.pause()
    soundBtn.classList.add("muted")
    soundBtn.innerHTML = `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    class="bi bi-play-fill"
    viewBox="0 0 16 16"
  >
    <path
      d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"
    />
  </svg>`
  }
})

let composer = new EffectComposer(renderer)
// const renderPass = new RenderPass(scene, camera)
// composer.addPass(renderPass)
composer.addPass(new RenderPass(scene, camera))

// const effectPass = new EffectPass(camera, new BloomEffect())
// effectPass.renderToScreen = true
// composer.addPass(effectPass)
// const glitchPass = new GlitchPass()
// composer.addPass(glitchPass)

animate()

function animate() {
  composer.render()
  requestAnimationFrame(animate)
  controls.update()
  //renderer.render(scene, camera)
}
