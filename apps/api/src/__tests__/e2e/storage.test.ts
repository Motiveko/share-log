import supertest from "supertest";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import App from "@api/app";
import { UserResponseDto } from "@api/features/user/dto";
import type { DataAndMessageResponse } from "@api/types/express";
import { container } from "tsyringe";

describe("Storage API End-to-End Tests", () => {
  let app: App;
  let agent: supertest.Agent;
  let user: UserResponseDto;

  beforeAll(async () => {
    app = container.resolve(App);
    await app.bootstrap();
    agent = supertest.agent(app.getExpress());
    // login
    user = await agent
      .post("/api/v1/test/login")
      .send({ email: "test22@test.com" })
      .expect(200)
      .then((res) => (res.body as DataAndMessageResponse<UserResponseDto>).data)
      .catch((err) => {
        throw err;
      });

    console.log("after login");
  });

  afterAll(async () => {
    await agent.post("/api/v1/test/logout").send({ id: user.id }).expect(200);
    await app.cleanup();
  });

  describe("POST /api/v1/storage/presigned-url", () => {
    it("should return 401 without authentication", async () => {
      const unauthenticatedRequest = supertest(app.getExpress());
      await unauthenticatedRequest
        .post("/api/v1/storage/presigned-url")
        .send({ fileName: "test-file.jpg" })
        .expect(401);
    });

    it("should return 400 if fileName is missing", async () => {
      await agent.post("/api/v1/storage/presigned-url").send({}).expect(400);
    });

    it("should return 400 if fileName is empty", async () => {
      await agent
        .post("/api/v1/storage/presigned-url")
        .send({ fileName: "" })
        .expect(400);
    });

    it("should return 400 if fileName is not a string", async () => {
      await agent
        .post("/api/v1/storage/presigned-url")
        .send({ fileName: 12345 })
        .expect(400);
    });

    it("should generate presigned URL successfully", async () => {
      const testFileName = "test-image.jpg";
      const response = await agent
        .post("/api/v1/storage/presigned-url")
        .send({ fileName: testFileName })
        .expect(200);

      const body = response.body as DataAndMessageResponse<{
        uploadUrl: string;
        accessUrl: string;
      }>;
      expect(body.message).toBe("ok");
      expect(body.data).toBeDefined();
      expect(typeof body.data.uploadUrl).toBe("string");
      expect(typeof body.data.accessUrl).toBe("string");
    });
  });
});
