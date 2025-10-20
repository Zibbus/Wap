// API "diretta"
await fetch("http://localhost:4000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ usernameOrEmail: username.trim(), password }),
});
