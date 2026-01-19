import { PushSubscription } from "@repo/entities/push-subscription";
import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class PushSubscriptionRepository extends Repository<PushSubscription> {
  constructor(dataSource: DataSource) {
    super(PushSubscription, dataSource.createEntityManager());
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    return this.findOne({ where: { endpoint } });
  }

  async findByUserId(userId: number): Promise<PushSubscription[]> {
    return this.find({ where: { userId } });
  }
}
