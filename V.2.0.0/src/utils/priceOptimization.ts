import { SimpleLinearRegression } from 'ml-regression';
import { addDays, differenceInDays, parseISO } from 'date-fns';

interface SalesData {
  price: number;
  quantity: number;
  timestamp: string;
}

interface OptimizationResult {
  optimalDiscount: number;
  optimalPrice: number;
  originalPrice: number;
  expectedRevenue: number;
  expectedProfit: number;
  confidence: number;
  dailyRevenue: number;
  dailyProfit: number;
  campaignDays: number;
  expectedQuantity: {
    daily: number;
    total: number;
  };
  priceElasticity: {
    value: number;
    interpretation: string;
  };
}

interface CampaignPeriod {
  startDate: string;
  endDate: string;
}

function interpretElasticity(elasticity: number): string {
  if (elasticity < 0.5) return 'Inelastic - Demand is not very sensitive to price changes';
  if (elasticity < 1) return 'Moderately elastic - Demand shows some response to price changes';
  if (elasticity < 2) return 'Elastic - Demand is sensitive to price changes';
  return 'Highly elastic - Demand is very sensitive to price changes';
}

export function calculatePriceElasticity(salesData: SalesData[]): number {
  if (salesData.length < 2) return -1; // Default elastic demand

  // Sort by price to get price range
  const sortedByPrice = [...salesData].sort((a, b) => a.price - b.price);
  const p1 = sortedByPrice[0].price;
  const p2 = sortedByPrice[sortedByPrice.length - 1].price;

  // Get average quantities for these prices
  const q1 = salesData.filter(d => d.price === p1).reduce((sum, d) => sum + d.quantity, 0) / 
             salesData.filter(d => d.price === p1).length;
  const q2 = salesData.filter(d => d.price === p2).reduce((sum, d) => sum + d.quantity, 0) / 
             salesData.filter(d => d.price === p2).length;

  // Calculate price elasticity
  const percentPriceChange = (p2 - p1) / p1;
  const percentQuantityChange = (q2 - q1) / q1;
  
  return Math.abs(percentQuantityChange / percentPriceChange);
}

function calculateSeasonalityFactor(date: Date): number {
  const dayOfWeek = date.getDay();
  
  // Higher factors for weekends
  if (dayOfWeek === 0) return 1.1; // Sunday
  if (dayOfWeek === 5 || dayOfWeek === 6) return 1.3; // Friday and Saturday
  return 0.9; // Weekdays
}

function calculateTimePressureFactor(campaignDays: number): number {
  // Shorter campaigns need more aggressive pricing
  // Returns a factor between 1.0 (no pressure) and 1.5 (high pressure)
  const maxPressure = 1.5;
  const minPressure = 1.0;
  const shortCampaign = 7; // 7 days or less is considered short
  const longCampaign = 30; // 30 days or more is considered long

  if (campaignDays <= shortCampaign) {
    return maxPressure;
  }
  if (campaignDays >= longCampaign) {
    return minPressure;
  }

  // Linear interpolation between max and min pressure
  const pressureRange = maxPressure - minPressure;
  const daysRange = longCampaign - shortCampaign;
  const daysFromShort = campaignDays - shortCampaign;
  
  return maxPressure - (pressureRange * daysFromShort / daysRange);
}

export function optimizePrice(
  currentPrice: number,
  cost: number,
  salesData: SalesData[],
  goal: 'profit' | 'sales' | 'inventory',
  minDiscount: number = 0,
  maxDiscount: number = 50,
  campaignPeriod?: CampaignPeriod
): OptimizationResult {
  const elasticity = calculatePriceElasticity(salesData);
  
  // Convert discount range to price range
  const minPrice = currentPrice * (1 - maxDiscount / 100);
  const maxPrice = currentPrice * (1 - minDiscount / 100);
  
  // Create price points to test
  const pricePoints = Array.from({ length: 50 }, (_, i) => 
    Math.round(minPrice + (i * (maxPrice - minPrice) / 49))
  );

  let optimalPrice = currentPrice;
  let maxObjectiveValue = 0;
  let optimalDailyQuantity = 0;
  let optimalTotalQuantity = 0;
  
  // Regression for demand prediction
  const x = salesData.map(d => d.price);
  const y = salesData.map(d => d.quantity);
  const regression = new SimpleLinearRegression(x, y);
  
  // Calculate confidence based on R-squared
  const predictedY = x.map(price => regression.predict(price));
  const meanY = y.reduce((a, b) => a + b) / y.length;
  const ssRes = y.reduce((sum, actual, i) => sum + Math.pow(actual - predictedY[i], 2), 0);
  const ssTot = y.reduce((sum, actual) => sum + Math.pow(actual - meanY, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);

  // Calculate campaign duration and average daily quantities
  let campaignDays = 1;
  let seasonalityFactors = [1];
  let timePressureFactor = 1;

  if (campaignPeriod) {
    const startDate = parseISO(campaignPeriod.startDate);
    const endDate = parseISO(campaignPeriod.endDate);
    campaignDays = differenceInDays(endDate, startDate) + 1;

    // Calculate seasonality factors for each day of the campaign
    seasonalityFactors = Array.from({ length: campaignDays }, (_, i) => {
      const date = addDays(startDate, i);
      return calculateSeasonalityFactor(date);
    });

    // Calculate time pressure factor for inventory optimization
    timePressureFactor = calculateTimePressureFactor(campaignDays);
  }
  
  // Calculate average daily sales quantity from historical data
  const avgDailyQuantity = y.reduce((sum, qty) => sum + qty, 0) / y.length;
  
  // Test each price point
  pricePoints.forEach(price => {
    // Calculate base expected quantity
    const baseQuantity = Math.max(0, Math.round(regression.predict(price)));
    
    // Apply seasonality and campaign duration
    const totalQuantity = Math.round(seasonalityFactors.reduce((sum, factor) => 
      sum + (baseQuantity * factor), 0
    ));

    const dailyQuantity = Math.round(totalQuantity / campaignDays);
    const revenue = price * totalQuantity;
    const profit = (price - cost) * totalQuantity;
    
    let objectiveValue = 0;
    switch (goal) {
      case 'profit':
        objectiveValue = profit;
        break;
      case 'sales':
        objectiveValue = revenue;
        break;
      case 'inventory':
        // For inventory optimization, we want to:
        // 1. Maximize quantity sold (weighted by time pressure)
        // 2. Consider the campaign duration
        // 3. Balance against maintaining some profit
        const profitMargin = (price - cost) / price;
        const quantityImprovement = dailyQuantity / avgDailyQuantity;
        
        // Combine factors with weights
        objectiveValue = (
          quantityImprovement * 0.6 * timePressureFactor + // Quantity improvement weighted by time pressure
          profitMargin * 0.4 // Still maintain some profit consideration
        ) * totalQuantity; // Scale by total quantity to favor higher volume
        break;
    }
    
    if (objectiveValue > maxObjectiveValue) {
      maxObjectiveValue = objectiveValue;
      optimalPrice = price;
      optimalDailyQuantity = dailyQuantity;
      optimalTotalQuantity = totalQuantity;
    }
  });

  const discountPercentage = ((currentPrice - optimalPrice) / currentPrice) * 100;
  
  // Calculate expected quantity with seasonality for the entire campaign period
  const baseQuantity = Math.max(0, Math.round(regression.predict(optimalPrice)));
  const totalQuantity = Math.round(seasonalityFactors.reduce((sum, factor) => 
    sum + (baseQuantity * factor), 0
  ));

  // Calculate daily and total campaign metrics
  const dailyRevenue = Math.round((optimalPrice * totalQuantity) / campaignDays);
  const dailyProfit = Math.round((optimalPrice - cost) * totalQuantity / campaignDays);
  const campaignRevenue = dailyRevenue * campaignDays;
  const campaignProfit = dailyProfit * campaignDays;
  
  return {
    optimalDiscount: Math.round(discountPercentage),
    optimalPrice: Math.round(optimalPrice),
    originalPrice: Math.round(currentPrice),
    expectedRevenue: Math.round(campaignRevenue),
    expectedProfit: Math.round(campaignProfit),
    dailyRevenue: Math.round(dailyRevenue),
    dailyProfit: Math.round(dailyProfit),
    campaignDays,
    confidence: Math.round(rSquared * 100),
    expectedQuantity: {
      daily: Math.round(optimalDailyQuantity),
      total: Math.round(optimalTotalQuantity)
    },
    priceElasticity: {
      value: Number(elasticity.toFixed(2)),
      interpretation: interpretElasticity(elasticity)
    }
  };
}