import { Hono } from "hono";
import { getReport } from "../services/report-store";

const app = new Hono();

// Get HTML report by ID
app.get("/:id", (c) => {
  const id = c.req.param("id");
  const html = getReport(id);

  if (!html) {
    return c.html(
      `<!DOCTYPE html>
<html>
<head>
  <title>Report Not Found</title>
  <style>
    body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #F3F4F6; }
    .error { text-align: center; }
    h1 { color: #DC2626; }
    p { color: #6B7280; }
  </style>
</head>
<body>
  <div class="error">
    <h1>404</h1>
    <p>Report not found: ${id}</p>
  </div>
</body>
</html>`,
      404
    );
  }

  return c.html(html);
});

export default app;
