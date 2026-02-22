/**
 * Comparison mode types
 */
export type ComparisonMode = 'farm_avg' | 'last_season' | 'other_crop';

/**
 * Single comparison metric
 */
export interface ComparisonMetric {
  label: string;
  icon: string;
  currentValue: number | null;
  compareValue: number | null;
  unit: string;
  status: 'better' | 'worse' | 'same' | 'unknown';
  difference: number;
  percentChange: number;
}

/**
 * Crop comparison response DTO
 */
export class CropComparisonDto {
  /**
   * Comparison mode used
   */
  mode: ComparisonMode;

  /**
   * ID of the crop being compared (if mode is 'other_crop')
   */
  compareCropId?: string;

  /**
   * Comparison metrics
   */
  metrics: ComparisonMetric[];

  /**
   * Overall status summary
   */
  overallStatus: 'better' | 'worse' | 'same' | 'unknown';

  /**
   * Summary statistics
   */
  summary: {
    betterCount: number;
    worseCount: number;
    sameCount: number;
  };

  /**
   * Period this comparison covers
   */
  period: {
    startDate: Date;
    endDate: Date;
  };
}


