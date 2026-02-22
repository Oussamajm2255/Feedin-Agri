/**
 * Sustainability metrics for a crop
 * Calculated based on sensor data and irrigation patterns
 */
export class CropSustainabilityDto {
  /**
   * Water saved in liters compared to baseline irrigation
   * Calculated from actual irrigation events vs optimal irrigation
   */
  waterSaved: number;

  /**
   * Energy saved in kWh from optimized device operations
   * Calculated from device runtime vs baseline
   */
  energySaved: number;

  /**
   * Carbon offset in kg CO2 equivalent
   * Estimated from reduced water/energy usage and crop carbon sequestration
   */
  carbonOffset: number;

  /**
   * Overall sustainability score (0-100)
   */
  sustainabilityScore: number;

  /**
   * Efficiency breakdown
   */
  efficiency: {
    waterEfficiency: number; // percentage
    energyEfficiency: number; // percentage
    resourceScore: number; // 0-100
  };

  /**
   * Period this data covers
   */
  period: {
    startDate: Date;
    endDate: Date;
    daysAnalyzed: number;
  };
}


