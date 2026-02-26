export class HazardService {
  async run(data: { allProperties?: boolean; propertyId?: number }) {
    if (data.allProperties) {
      console.log("Hazard ingestion: all properties — TODO");
    } else if (data.propertyId) {
      await this.runForProperty(data.propertyId);
    }
  }

  async runForProperty(propertyId: number) {
    console.log(`Hazard ingestion for property ${propertyId} — TODO`);
  }
}
