/**
 * Forecast utility module for sales and order predictions
 * Implements statistical methods for time series analysis and forecasting
 * Updated: April 15, 2025
 */

import { SimpleLinearRegression } from 'ml-regression';
import {
  addDays,
  parseISO,
  format,
  isAfter,
  startOfDay,
  getDay,
  getMonth,
} from 'date-fns';

/**
 * Base interface for metric data points
 * Contains raw sales and order numbers
 */
interface Metrics {
  timestamp: string;
  metrics: {
    sales: number;
    orders: number;
    [key: string]: any;
  };
}

/**
 * Extended interface for forecast results
 * Includes confidence intervals for both sales and orders
 */
interface ForecastResult {
  timestamp: string;
  metrics: {
    sales: number;
    orders: number;
    salesLower: number;
    salesUpper: number;
    ordersLower: number;
    ordersUpper: number;
  };
  isForecast: boolean;
}

/**
 * Available forecast time ranges
 */
export type ForecastRange = '7d' | '14d' | '1month' | '3months' | '6months';

/**
 * Converts forecast range to number of days
 * @param range - The forecast range to convert
 * @returns Number of days for the given range
 * Updated: April 15, 2025
 */
export const getDaysForRange = (range: ForecastRange): number => {
  switch (range) {
    case '7d':
      return 7;
    case '14d':
      return 14;
    case '1month':
      return 30;
    case '3months':
      return 90;
    case '6months':
      return 180;
    default:
      return 30;
  }
};

/**
 * Handles outliers in the dataset using IQR method
 * Replaces outliers with moving averages to maintain data continuity
 * @param data - Array of numerical values to process
 * @returns Processed array with outliers handled
 * Updated: April 15, 2025
 */
function handleOutliers(data: number[]): number[] {
  if (data.length < 4) return data;

  // Calculate quartiles
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  // Replace outliers with moving average
  return data.map((value, index) => {
    if (value < lowerBound || value > upperBound) {
      // Calculate moving average for replacement
      const start = Math.max(0, index - 3);
      const end = Math.min(data.length, index + 4);
      const window = data
        .slice(start, end)
        .filter((v) => v >= lowerBound && v <= upperBound);
      return window.length
        ? window.reduce((a, b) => a + b) / window.length
        : value;
    }
    return value;
  });
}

/**
 * Calculates seasonality patterns across different time scales
 * Analyzes daily, weekly, and monthly patterns in the data
 * @param data - Array of values to analyze
 * @param dates - Corresponding dates for the values
 * @returns Seasonality factors for different time scales
 * Updated: April 15, 2025
 */
function calculateSeasonality(
  data: number[],
  dates: Date[]
): { daily: number[]; weekly: number[]; monthly: number[] } {
  // Initialize patterns
  const dailyPatterns = new Array(7).fill(0);
  const dailyCounts = new Array(7).fill(0);
  const monthlyPatterns = new Array(12).fill(0);
  const monthlyCounts = new Array(12).fill(0);

  // Calculate average by day and month
  data.forEach((value, index) => {
    const date = dates[index];
    const dayOfWeek = getDay(date);
    const month = getMonth(date);

    dailyPatterns[dayOfWeek] += value;
    dailyCounts[dayOfWeek]++;
    monthlyPatterns[month] += value;
    monthlyCounts[month]++;
  });

  // Calculate factors
  const overallAverage = data.reduce((a, b) => a + b) / data.length;

  const dailyFactors = dailyPatterns.map((sum, i) =>
    dailyCounts[i] ? sum / dailyCounts[i] / overallAverage : 1
  );

  const weeklyFactors = Array(7)
    .fill(1)
    .map((_, i) => {
      const weekValues = data.filter((_, index) => getDay(dates[index]) === i);
      return weekValues.length
        ? weekValues.reduce((a, b) => a + b) /
            weekValues.length /
            overallAverage
        : 1;
    });

  const monthlyFactors = monthlyPatterns.map((sum, i) =>
    monthlyCounts[i] ? sum / monthlyCounts[i] / overallAverage : 1
  );

  return {
    daily: dailyFactors,
    weekly: weeklyFactors,
    monthly: monthlyFactors,
  };
}

/**
 * Calculates confidence intervals for forecasted values
 * Uses standard error and prediction intervals
 * @param regression - Linear regression model
 * @param x - Input values
 * @param y - Observed values
 * @param forecastX - Point to forecast
 * @returns Lower and upper bounds of the confidence interval
 * Updated: April 15, 2025
 */
function calculateConfidenceIntervals(
  regression: SimpleLinearRegression,
  x: number[],
  y: number[],
  forecastX: number
): { lower: number; upper: number } {
  // Calculate standard error of regression
  const predictions = x.map((val) => regression.predict(val));
  const residuals = y.map((actual, i) => actual - predictions[i]);
  const stdError = Math.sqrt(
    residuals.reduce((sum, r) => sum + r * r, 0) / (y.length - 2)
  );

  // Calculate prediction interval
  const xMean = x.reduce((a, b) => a + b) / x.length;
  const xSquaredSum = x.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0);

  const predictionError =
    stdError *
    Math.sqrt(1 + 1 / y.length + Math.pow(forecastX - xMean, 2) / xSquaredSum);

  const predicted = regression.predict(forecastX);
  return {
    lower: Math.max(0, predicted - 1.96 * predictionError),
    upper: predicted + 1.96 * predictionError,
  };
}

/**
 * Main function to generate sales and order forecasts
 * Combines multiple statistical methods for accurate predictions
 * @param historicalData - Past sales and order data
 * @param range - How far to forecast
 * @returns Forecast data and confidence score
 * Updated: April 15, 2025
 */
export function generateSalesForecast(
  historicalData: Metrics[],
  range: ForecastRange = '1month'
): {
  forecastData: ForecastResult[];
  confidence: number;
} {
  if (!historicalData || !historicalData.length) {
    console.warn('No historical data provided for forecast');
    return {
      forecastData: [],
      confidence: 0,
    };
  }

  // Ensure we have enough data points for meaningful forecast (at least 7 days)
  if (historicalData.length < 7) {
    console.warn('Insufficient historical data for reliable forecast');
    return {
      forecastData: [],
      confidence: Math.min(50, historicalData.length * 7), // Lower confidence for small datasets
    };
  }

  // Sort data by date
  const sortedData = [...historicalData].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Convert dates to numerical values
  const dates = sortedData.map((d) => new Date(d.timestamp));
  const firstDate = dates[0];
  const x = dates.map(
    (d) => (d.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handle outliers in sales and orders data
  const rawSales = sortedData.map((d) => d.metrics.sales || 0);
  const rawOrders = sortedData.map((d) => d.metrics.orders || 0);

  // Skip forecast if all values are 0
  if (rawSales.every((v) => v === 0) || rawOrders.every((v) => v === 0)) {
    console.warn('No non-zero values found in historical data');
    return {
      forecastData: [],
      confidence: 0,
    };
  }

  const ySales = handleOutliers(rawSales);
  const yOrders = handleOutliers(rawOrders);

  // Create and train regression models
  const salesRegression = new SimpleLinearRegression(x, ySales);
  const ordersRegression = new SimpleLinearRegression(x, yOrders);

  // Calculate seasonality factors
  const salesSeasonality = calculateSeasonality(ySales, dates);
  const ordersSeasonality = calculateSeasonality(yOrders, dates);

  // Generate forecast
  const today = startOfDay(new Date());
  const daysToForecast = getDaysForRange(range);
  const forecast: ForecastResult[] = [];

  for (let i = 0; i < daysToForecast; i++) {
    const forecastDate = addDays(today, i);
    const daysSinceStart =
      (forecastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

    // Get seasonality factors for this date
    const dayOfWeek = getDay(forecastDate);
    const month = getMonth(forecastDate);

    // Calculate base predictions
    const salesIntervals = calculateConfidenceIntervals(
      salesRegression,
      x,
      ySales,
      daysSinceStart
    );
    const ordersIntervals = calculateConfidenceIntervals(
      ordersRegression,
      x,
      yOrders,
      daysSinceStart
    );

    // Apply seasonality adjustments
    const salesSeasonalFactor =
      salesSeasonality.daily[dayOfWeek] * salesSeasonality.monthly[month];
    const ordersSeasonalFactor =
      ordersSeasonality.daily[dayOfWeek] * ordersSeasonality.monthly[month];

    const predictedSales = Math.max(
      0,
      Math.round(salesRegression.predict(daysSinceStart) * salesSeasonalFactor)
    );
    const predictedOrders = Math.max(
      0,
      Math.round(
        ordersRegression.predict(daysSinceStart) * ordersSeasonalFactor
      )
    );

    forecast.push({
      timestamp: format(forecastDate, 'yyyy-MM-dd'),
      metrics: {
        sales: predictedSales,
        orders: predictedOrders,
        salesLower: Math.max(
          0,
          Math.round(salesIntervals.lower * salesSeasonalFactor)
        ),
        salesUpper: Math.round(salesIntervals.upper * salesSeasonalFactor),
        ordersLower: Math.max(
          0,
          Math.round(ordersIntervals.lower * ordersSeasonalFactor)
        ),
        ordersUpper: Math.round(ordersIntervals.upper * ordersSeasonalFactor),
      },
      isForecast: true,
    });
  }

  // Calculate confidence scores
  const salesConfidence = calculateConfidence(salesRegression, x, ySales);
  const ordersConfidence = calculateConfidence(ordersRegression, x, yOrders);

  // Calculate data quality score based on amount and consistency of data
  const dataQualityScore = Math.min(1, historicalData.length / 60); // Higher weight for more data
  const consistencyScore = calculateDataConsistency(dates);

  // Calculate seasonality strength
  const seasonalityScore = calculateSeasonalityStrength(
    salesSeasonality,
    ordersSeasonality
  );

  // Combine all factors for final confidence score
  const averageConfidence = Math.round(
    ((salesConfidence + ordersConfidence) / 2) *
      dataQualityScore *
      seasonalityScore *
      consistencyScore
  );

  return {
    forecastData: forecast,
    confidence: Math.min(100, Math.max(0, averageConfidence)), // Ensure between 0 and 100
  };
}

/**
 * Calculates confidence score for the regression model
 * Based on R-squared value of the predictions
 * @param regression - Linear regression model
 * @param x - Input values
 * @param y - Observed values
 * @returns Confidence score (0-100)
 * Updated: April 15, 2025
 */
function calculateConfidence(
  regression: SimpleLinearRegression,
  x: number[],
  y: number[]
): number {
  try {
    // Add logging
    console.log('Calculating confidence:', {
      dataPoints: x.length,
      xRange: [Math.min(...x), Math.max(...x)],
      yRange: [Math.min(...y), Math.max(...y)],
    });

    const predictions = x.map((val) => regression.predict(val));
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;

    // Calculate R-squared
    const ssRes = y.reduce(
      (sum, actual, i) => sum + Math.pow(actual - predictions[i], 2),
      0
    );
    const ssTot = y.reduce(
      (sum, actual) => sum + Math.pow(actual - meanY, 2),
      0
    );

    // Prevent division by zero
    if (ssTot === 0) {
      console.log(
        'Warning: Total sum of squares is 0, defaulting to 50% confidence'
      );
      return 50;
    }

    const rSquared = Math.max(0, Math.min(1, 1 - ssRes / ssTot));

    // Calculate adjusted confidence score
    const baseConfidence = rSquared * 100;

    // Adjust confidence based on data points
    const dataPointsScore = Math.min(1, x.length / 30); // Max score at 30 data points

    // Adjust confidence based on prediction error
    const meanAbsError =
      y.reduce((sum, actual, i) => sum + Math.abs(actual - predictions[i]), 0) /
      y.length;
    const errorScore = Math.max(0, 1 - meanAbsError / meanY);

    const finalConfidence = Math.round(
      baseConfidence * 0.4 + // Weight for R-squared
        dataPointsScore * 30 + // Weight for number of data points
        errorScore * 30 // Weight for prediction error
    );

    console.log('Confidence calculation:', {
      rSquared,
      baseConfidence,
      dataPointsScore,
      errorScore,
      finalConfidence,
    });

    return Math.min(100, Math.max(0, finalConfidence));
  } catch (error) {
    console.error('Error calculating confidence:', error);
    return 50; // Return moderate confidence on error
  }
}

/**
 * Evaluates the strength of seasonality patterns
 * Higher variation indicates stronger seasonal effects
 * @param salesSeasonality - Seasonality factors for sales
 * @param ordersSeasonality - Seasonality factors for orders
 * @returns Seasonality strength score (0.8-1.0)
 * Updated: April 15, 2025
 */
function calculateSeasonalityStrength(
  salesSeasonality: { daily: number[]; weekly: number[]; monthly: number[] },
  ordersSeasonality: { daily: number[]; weekly: number[]; monthly: number[] }
): number {
  try {
    // Calculate variation in seasonality factors
    const salesVariation = calculateVariation([
      ...salesSeasonality.daily,
      ...salesSeasonality.monthly,
    ]);

    const ordersVariation = calculateVariation([
      ...ordersSeasonality.daily,
      ...ordersSeasonality.monthly,
    ]);

    // Normalize variations to prevent extreme values
    const normalizedSalesVar = Math.min(1, salesVariation);
    const normalizedOrdersVar = Math.min(1, ordersVariation);

    // Strong seasonality patterns increase confidence
    const seasonalityScore =
      0.8 + Math.min(0.2, (normalizedSalesVar + normalizedOrdersVar) / 4);

    console.log('Seasonality calculation:', {
      salesVariation,
      ordersVariation,
      normalizedSalesVar,
      normalizedOrdersVar,
      seasonalityScore,
    });

    return seasonalityScore;
  } catch (error) {
    console.error('Error calculating seasonality strength:', error);
    return 0.8; // Return moderate seasonality score on error
  }
}

/**
 * Calculates statistical variation in a dataset
 * Used to measure pattern strength
 * @param factors - Array of numerical values
 * @returns Standard deviation of the values
 * Updated: April 15, 2025
 */
function calculateVariation(factors: number[]): number {
  const mean = factors.reduce((a, b) => a + b) / factors.length;
  const variance =
    factors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    factors.length;
  return Math.sqrt(variance);
}

// Add new helper function to check data consistency
function calculateDataConsistency(dates: Date[]): number {
  if (dates.length < 2) return 0.5;

  // Check for gaps in the data
  let gapCount = 0;
  for (let i = 1; i < dates.length; i++) {
    const daysDiff =
      (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 1) gapCount++;
  }

  // Return score between 0.5 and 1 based on gaps
  return Math.max(0.5, 1 - gapCount / dates.length);
}
