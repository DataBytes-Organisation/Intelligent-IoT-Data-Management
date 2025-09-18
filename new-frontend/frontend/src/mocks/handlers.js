import { http, HttpResponse } from "msw";


const demoUser = { id: 1, email: "demo@databytes.io", role: "user" };
const makeToken = () => "mock." + Math.random().toString(36).slice(2) + ".jwt";


export const handlers = [
http.post("/api/auth/login", async ({ request }) => {
const { email, password } = await request.json().catch(() => ({}));
if (!email || !password) {
return HttpResponse.json({ message: "Email and password required" }, { status: 400 });
}
if (email.toLowerCase() !== demoUser.email.toLowerCase()) {
return HttpResponse.json({ message: "Invalid credentials" }, { status: 401 });
}
return HttpResponse.json({ token: makeToken(), user: demoUser });
}),


http.get("/api/data/items", ({ request }) => {
const auth = request.headers.get("authorization") || "";
const [, token] = auth.split(" ");
if (!auth.startsWith("Bearer ") || !token) {
return HttpResponse.json({ message: "Missing or invalid token" }, { status: 401 });
}
if (!token.startsWith("mock.")) {
return HttpResponse.json({ message: "Expired or invalid token" }, { status: 401 });
}
return HttpResponse.json([
{ id: 1, owner: demoUser.id, name: "Temperature Sensor A" },
{ id: 2, owner: demoUser.id, name: "Vibration Sensor B" },
]);
}),
];