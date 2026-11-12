export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // 1. OBSŁUGA LOGOWANIA (POST /login)
  if (request.method === "POST" && url.pathname === "/login") {
    const formData = await request.formData();
    const id = formData.get("id");
    const password = formData.get("password");
    const users = JSON.parse(env.USERS_LIST || "{}");

    if (users[id] && users[id] === password) {
      return new Response(null, {
        status: 302,
        headers: {
          "Location": "/",
          "Set-Cookie": `auth_token=${env.SECRET_TOKEN}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`
        }
      });
    }
    return new Response("Błędne ID lub hasło. <a href='/'>Wróć i spróbuj ponownie</a>", {
      status: 401,
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  }

  // 2. OBSŁUGA WYLOGOWANIA (GET /logout)
  if (url.pathname === "/logout") {
    return new Response(null, {
      status: 302,
      headers: {
        "Location": "/",
        "Set-Cookie": "auth_token=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
      }
    });
  }

  // 3. WERYFIKACJA SESJI (Sprawdzamy, czy użytkownik jest zalogowany)
  const cookie = request.headers.get("Cookie") || "";
  const isLoggedIn = env.SECRET_TOKEN && cookie.includes(`auth_token=${env.SECRET_TOKEN}`);

  if (!isLoggedIn) {
    // Jeśli niezalogowany - pokazujemy tylko formularz logowania
    const loginHtml = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Logowanie</title>
        <style>
          body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f0f2f5; }
          form { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 280px; }
          h2 { margin-top: 0; text-align: center; }
          input { width: 100%; box-sizing: border-box; margin-bottom: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
          button { width: 100%; padding: 10px; background: #0051c3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
          button:hover { background: #003d96; }
        </style>
      </head>
      <body>
        <form method="POST" action="/login">
          <h2>Logowanie</h2>
          <input type="text" name="id" placeholder="Twoje ID" required />
          <input type="password" name="password" placeholder="Hasło" required />
          <button type="submit">Zaloguj się</button>
        </form>
      </body>
      </html>
    `;
    return new Response(loginHtml, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // 4. ZAPISYWANIE PLIKU NA GITHUBA (POST /api/save - tylko dla zalogowanych)
  if (request.method === "POST" && url.pathname === "/api/save") {
    try {
      const { filename, content } = await request.json();
      const apiUrl = `https://github.com{env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${filename}`;
      const ghHeaders = {
        "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "Cloudflare-Pages-App"
      };

      // Sprawdzamy, czy plik już istnieje (aby pobrać jego SHA do nadpisania)
      let sha = null;
      const checkRes = await fetch(apiUrl, { headers: ghHeaders });
      if (checkRes.ok) {
        const existingFile = await checkRes.json();
        sha = existingFile.sha;
      }

      // Kodujemy treść do Base64 z obsługą polskich znaków
      const bytes = new TextEncoder().encode(content);
      const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
      const base64Content = btoa(binString);

      // Wysyłamy plik do GitHuba
      const saveRes = await fetch(apiUrl, {
        method: "PUT",
        headers: ghHeaders,
        body: JSON.stringify({
          message: `Aktualizacja pliku ${filename} ze strony`,
          content: base64Content,
          ...(sha ? { sha } : {})
        })
      });

      if (!saveRes.ok) {
        const errText = await saveRes.text();
        return new Response(JSON.stringify({ error: errText }), { status: 500 });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // 5. Jeśli użytkownik jest zalogowany i wchodzi normalnie na stronę -> otwieramy index.html
  return next();
}
