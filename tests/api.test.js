const request = require("supertest");
const app = require("../src/index"); // Import your Express app

describe("Automated Meeting Minutes Generator API", () => {

  it("GET / should return running message", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Automated Meeting Minutes Generator API Running/);


  });

  it("POST /upload without file should return 400", async () => {
    const res = await request(app)
      .post("/upload")
      .send();
    expect(res.statusCode).toBe(400);
  });

  it("POST /transcribe with filename should return stub transcript", async () => {
    const res = await request(app)
      .post("/transcribe")
      .send({ filename: "testfile.mp3" });
    expect(res.statusCode).toBe(200);
    expect(res.body.transcript).toContain("stub transcript");
  });

  it("POST /transcribe without filename should return 400", async () => {
    const res = await request(app)
      .post("/transcribe")
      .send({});
    expect(res.statusCode).toBe(400);
  });

  it("POST /extract-actions with transcript should return extracted action items", async () => {
    const transcript = "This is an action. This is unrelated.";
    const res = await request(app)
      .post("/extract-actions")
      .send({ transcript });
    expect(res.statusCode).toBe(200);
    expect(res.body.actionItems).toContain("This is an action");
  });

  it("POST /extract-actions without transcript should return 400", async () => {
    const res = await request(app)
      .post("/extract-actions")
      .send({});
    expect(res.statusCode).toBe(400);
  });
});
