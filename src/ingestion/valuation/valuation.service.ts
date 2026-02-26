export class ValuationService {
  async run(data: { allProperties?: boolean; propertyId?: number }) {
    if (data.allProperties) {
      console.log("Valuation ingestion: all properties — TODO");
    } else if (data.propertyId) {
      await this.runForProperty(data.propertyId);
    }
  }

  async runForProperty(propertyId: number) {
    console.log(`Valuation ingestion for property ${propertyId} — TODO`);
  }
}
