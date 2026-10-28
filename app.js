const REPO_PATH = "/test/";
const SITE_URL = "https://dariuszt007.github.io/test/";

const auth0Config = {
  domain: "dev-zrgy8kuujx18b5rt.us.auth0.com",
  clientId: "tpc_s5QX9693uvCNA1WZnWKLzd",
  authorizationParams: {
    redirect_uri: SITE_URL
  }
};

let auth0Client;

async function initAuth() {
  const status = document.getElementById("status");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logout");
  const userBox = document.getElementById("user");

  try {
    status.textContent = "Inicjalizacja Auth0...";

    auth0Client = await auth0.createAuth0Client(auth0Config);

    if (window.location.search.includes("code=") && window.location.search.includes("state=")) {
      status.textContent = "Obsługa przekierowania logowania...";

      await auth0Client.handleRedirectCallback();

      window.history.replaceState({}, document.title, REPO_PATH);
    }

    const isAuthenticated = await auth0Client.isAuthenticated();

    loginBtn.onclick = async () => {
      try {
        await auth0Client.loginWithRedirect();
      } catch (e) {
        status.textContent = "Błąd logowania: " + (e.message || JSON.stringify(e));
        console.error("LOGIN ERROR", e);
      }
    };

    logoutBtn.onclick = async () => {
      try {
        await auth0Client.logout({
          logoutParams: {
            returnTo: SITE_URL
          }
        });
      } catch (e) {
        status.textContent = "Błąd wylogowania: " + (e.message || JSON.stringify(e));
        console.error("LOGOUT ERROR", e);
      }
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
  } catch (e) {
    status.textContent = "Błąd Auth0: " + (e.message || JSON.stringify(e));
    console.error("AUTH0 ERROR", e);
  }
}

initAuth();
