const REPO_PATH = "/test";

const auth0Config = {
  domain: "dev-zrgy8kuujx18b5rt.us.auth0.com",
  clientId: "tpc_s5QX9693uvCNA1WZnWKLzd",
  authorizationParams: {
    redirect_uri: "https://dariuszt007.github.io/test"
  }
};

let auth0Client;

async function initAuth() {
  auth0Client = await auth0.createAuth0Client(auth0Config);

  if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, REPO_PATH);
  }

  const isAuthenticated = await auth0Client.isAuthenticated();

  const status = document.getElementById("status");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const userBox = document.getElementById("user");

  loginBtn.onclick = async () => {
    await auth0Client.loginWithRedirect();
  };

  logoutBtn.onclick = async () => {
    await auth0Client.logout({
      logoutParams: {
        returnTo: "https://dariuszt007.github.io/test"
      }
    });
  };

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
}

initAuth();
