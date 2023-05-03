const formLogin = document.querySelector(".form-login")

if (formLogin) {
  formLogin.addEventListener("submit", function (e) {
    e.preventDefault()

    const email = document.querySelector("#email").value
    const password = document.querySelector("#password").value

    fetch("/auth/login", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success && data.msg) {
          document.querySelector(".form-error").textContent = `${data.msg}`
          return
        } else {
          localStorage.setItem("userInfo", JSON.stringify(data.userInfo))
          window.location.href = "/"
        }
      })
      .catch((err) => console.log(err))
  })
}

// header info
const userBox = document.querySelector(".user-box")
const userInfo = JSON.parse(localStorage.getItem("userInfo"))

if (!!userInfo) {
  userBox.innerHTML = `<p>Hello, ${userInfo.username}</p> <div class="logout"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-bar-right" viewBox="0 0 16 16">
  <path fill-rule="evenodd" d="M6 8a.5.5 0 0 0 .5.5h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L12.293 7.5H6.5A.5.5 0 0 0 6 8Zm-2.5 7a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 1 0v13a.5.5 0 0 1-.5.5Z"/>
</svg></div>`
} else {
  userBox.innerHTML = `<a href="/login"> Login </a>`
}

const logoutBtn = document.querySelector(".logout")
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("userInfo")
    window.location.reload()
  })
}
