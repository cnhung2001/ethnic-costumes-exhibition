const formLogin = document.querySelector(".form-login")

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
