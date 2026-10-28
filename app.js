const auth0Config = {
  domain: "TWOJA_DOMENA_AUTH0",
  clientId: "TWOJ_CLIENT_ID",
  authorizationParams: {
    redirect_uri: window.location.origin
  }
};

let auth0Client;

async function initAuth() {
  auth0Client = await auth0.createAuth0Client(auth0Config);

  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, "/");
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  const status = document.getElementById("status");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const userBox = document.getElementById("user");

  if (isAuthenticated) {
    const user = await auth0Client.getUser();

    status.textContent = "Jesteś zalogowany";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userBox.style.display = "block";

    document.getElementById("name").textContent = `Imię: ${user.name || "-"}`;
    document.getElementById("email").textContent = `Email: ${user.email || "-"}`;
    document.getElementById("picture").src = user.picture || "";
  } else {
    status.textContent = "Nie jesteś zalogowany";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userBox.style.display = "none";
  }

  loginBtn.addEventListener("click", async () => {
    await auth0Client.loginWithRedirect();
  });

  logoutBtn.addEventListener("click", async () => {
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  });
}

initAuth();
