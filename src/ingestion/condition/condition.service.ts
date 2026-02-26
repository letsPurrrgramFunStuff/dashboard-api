export class ConditionService {
  async run(data: { allProperties?: boolean; propertyId?: number }) {
    if (data.allProperties) {
      console.log("Condition ingestion: all properties — TODO");
    } else if (data.propertyId) {
      await this.runForProperty(data.propertyId);
    }
  }

  async runForProperty(propertyId: number) {
    console.log(`Condition ingestion for property ${propertyId} — TODO`);
  }
}
