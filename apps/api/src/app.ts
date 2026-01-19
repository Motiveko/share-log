import "reflect-metadata";
import { json, urlencoded } from "body-parser";
import express, { Router, type Express } from "express";
import morgan from "morgan";
import helmet from "helmet";
import { container } from "@api/container";
import { errorMiddleware } from "@api/middlewares/error";
import logger from "@api/lib/logger";
import { loggerMiddleware } from "@api/middlewares/logger";
import { AuthController } from "@api/features/user/auth-controller";
import {
  configurePassport,
  googleCallbackAuthenticate,
  googleLoginHandler,
  passportMiddleware,
  passportSession,
} from "@api/middlewares/passport";
import { sessionMiddleware } from "@api/middlewares/session";
import { corsMiddleware } from "@api/middlewares/cors";
import { requestContextMiddleware } from "@api/middlewares/request-context";
import { UserController } from "@api/features/user/user-controller";
import { ensureAuthenticated } from "@api/middlewares/auth";
import type { PrivateRoute } from "@api/types/express";
import { TestController } from "@api/features/test/controller";
import { notFoundMiddleware } from "@api/middlewares/not-found";
import { StorageController } from "@api/features/storage/controller";
import { PushController } from "@api/features/push/controller";
import { DataSource } from "@api/lib/datasource";
import { singleton } from "tsyringe";
import { RedisClient } from "@api/lib/redis";
import { Config } from "@api/config/env";

@singleton()
class App {
  private express: Express;
  private port: number;
  private server: ReturnType<Express["listen"]> | null = null;

  // Controllers resolved from DI container
  private authController!: AuthController;
  private userController!: UserController;
  private testController!: TestController;
  private storageController!: StorageController;
  private pushController!: PushController;

  constructor(
    private redisClient: RedisClient,
    private dataSource: DataSource
  ) {
    this.express = express();
    this.port = Number(Config.PORT || 5001);
  }

  getExpress() {
    return this.express;
  }

  /**
   * DataSource 초기화 후 DI 컨테이너에 Repository들을 등록하고
   * 컨트롤러들을 resolve합니다.
   */
  private initializeContainer() {
    // Configure passport after DI container is initialized
    configurePassport();

    // Resolve controllers from DI container
    this.authController = container.resolve(AuthController);
    this.userController = container.resolve(UserController);
    this.testController = container.resolve(TestController);
    this.storageController = container.resolve(StorageController);
    this.pushController = container.resolve(PushController);
  }

  mountRouter() {
    this.express.get("/healthz", (req, res) => res.send(200));
    this.express
      .disable("x-powered-by")
      .use(requestContextMiddleware)
      .use(loggerMiddleware)
      .use(urlencoded({ extended: true }))
      .use(json())
      .use(helmet())
      .use(corsMiddleware)
      .use(morgan("dev"))
      .use(sessionMiddleware)
      .use(passportMiddleware)
      .use(passportSession)
      .use("/api", this.mountPublicRoutes())
      .use("/api", this.mountTestRoutes())
      .use("/api", ensureAuthenticated, this.mountPrivateRoutes())
      .use(notFoundMiddleware)
      .use(errorMiddleware);
  }

  async initDatasource() {
    // TODO : datasource도 constructor injection 방식으로 변경
    this.dataSource = container.resolve(DataSource);
    await this.dataSource.initialize();
    return this;
  }

  async initRedis() {
    try {
      await this.redisClient.connect();
      logger.info("Redis client connected successfully");
    } catch (error) {
      logger.error({ message: "Failed to connect to Redis:", error });
      throw error;
    }
  }

  async bootstrap() {
    await this.initDatasource();
    await this.initRedis();
    this.initializeContainer();
    this.mountRouter();
    this.run();
    return this;
  }

  // cleanup 메서드 추가
  async cleanup() {
    // TODO : 객체에 dispose를 구현하면 종료시점에 알아서 호출된다. 그렇게 바꿀 것
    if (this.server) {
      await new Promise<void>((resolve, reject) => {
        this.server?.close((err?: Error) => {
          err ? reject(err) : resolve();
        });
      });
    }
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }

    if (this.redisClient.isOpen) {
      await this.redisClient.disconnect();
    }
  }

  private run() {
    this.server = this.express.listen(this.port, () => {
      logger.info(`express running on ${this.port}`);
    });
  }

  private mountPublicRoutes() {
    const publicRoute = Router();
    publicRoute.get("/v1/auth/google", googleLoginHandler);
    publicRoute.get(
      "/v1/auth/google/callback",
      googleCallbackAuthenticate,
      this.authController.googleCallback.bind(this.authController)
    );
    publicRoute.post(
      "/v1/auth/google/app",
      this.authController.googleOAuthApp.bind(this.authController)
    );
    publicRoute.post(
      "/v1/auth/logout",
      this.authController.logout.bind(this.authController)
    );

    // Push notifications - public endpoint for VAPID key
    publicRoute.get(
      "/v1/push/vapid-public-key",
      this.pushController.getVapidPublicKey.bind(this.pushController)
    );

    return publicRoute;
  }

  private mountPrivateRoutes() {
    const privateRoute = Router() as PrivateRoute;
    privateRoute.get(
      "/v1/user",
      this.userController.get.bind(this.userController)
    );

    privateRoute.post(
      "/v1/storage/presigned-url",
      this.storageController.createPresignedUrl.bind(this.storageController)
    );
    privateRoute.post(
      "/v1/storage/multipart/initiate",
      this.storageController.initiateMultipartUpload.bind(
        this.storageController
      )
    );
    privateRoute.post(
      "/v1/storage/multipart/presigned-urls",
      this.storageController.generatePartPresignedUrls.bind(
        this.storageController
      )
    );
    privateRoute.post(
      "/v1/storage/multipart/complete",
      this.storageController.completeMultipartUpload.bind(
        this.storageController
      )
    );
    privateRoute.post(
      "/v1/storage/multipart/abort",
      this.storageController.abortMultipartUpload.bind(this.storageController)
    );

    // Push notifications
    privateRoute.post(
      "/v1/push/subscribe",
      this.pushController.subscribe.bind(this.pushController)
    );
    privateRoute.post(
      "/v1/push/unsubscribe",
      this.pushController.unsubscribe.bind(this.pushController)
    );
    privateRoute.post(
      "/v1/push/test",
      this.pushController.sendTest.bind(this.pushController)
    );

    return privateRoute;
  }

  private mountTestRoutes() {
    // TODO : test router도 public/private 분리가 필요함.
    const testRoute = Router() as PrivateRoute;
    testRoute.post(
      "/v1/test/login",
      this.testController.login.bind(this.testController)
    );
    testRoute.post(
      "/v1/test/logout",
      this.testController.logout.bind(this.testController)
    );

    testRoute.post(
      "/v1/test/storage/presigned-url",
      this.storageController.createPresignedUrl.bind(this.storageController)
    );

    return testRoute;
  }
}

export default App;
