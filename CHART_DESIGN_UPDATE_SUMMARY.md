# Chart Design Update Summary

## Overview
Updated all chart components to match your specific design requirements:
- **Standard line**: Starts from 0 with enhanced styling and custom design
- **Actual data**: Displayed as dots only (no connecting lines)

## Changes Made

### 1. MortalityChart.tsx
✅ **Standard Line**: 
- Now starts from 0 (0,0 coordinates)
- Enhanced stroke width (4px instead of 3px)
- Added custom filter with shadow effect
- Increased dot size (5px radius)
- Enhanced opacity and styling

✅ **Actual Data**: 
- Removed all connecting lines
- Shows only dots (4px radius)
- Added opacity (0.8) for better visual distinction
- Updated legend to show dots instead of lines

### 2. BuildingPerformanceLineChart.tsx
✅ **Standard Line**: 
- Starts from 0 with enhanced path generation
- Increased stroke width to 4px
- Enhanced dot styling (5px radius, 2.5px stroke)

✅ **Actual Data**: 
- Removed connecting lines completely
- Shows only dots (4px radius)
- Added opacity (0.8)

### 3. BuildingPerformanceLineChartLarge.tsx
✅ **Standard Line**: 
- Starts from 0 with enhanced path generation
- Increased stroke width to 4px
- Enhanced dot styling (5px radius, 2.5px stroke)

✅ **Actual Data**: 
- Removed connecting lines completely
- Shows only dots (4px radius)
- Added opacity (0.8)

### 4. WeightChart.tsx
✅ **Standard Line**: 
- Starts from 0 with enhanced path generation
- Increased stroke width to 4px
- Enhanced dot styling (5px radius, 2.5px stroke)

✅ **Actual Data**: 
- Removed connecting lines completely
- Shows only dots (4px radius)
- Added opacity (0.8)

### 5. FCRChart.tsx
✅ **Standard Line**: 
- Starts from 0 with enhanced path generation
- Increased stroke width to 4px
- Enhanced dot styling (5px radius, 2.5px stroke)

✅ **Actual Data**: 
- Removed connecting lines completely
- Shows only dots (4px radius)
- Added opacity (0.8)

### 6. ADGChart.tsx
✅ **Standard Line**: 
- Starts from 0 with enhanced path generation
- Increased stroke width to 4px
- Enhanced dot styling (5px radius, 2.5px stroke)

✅ **Actual Data**: 
- Removed connecting lines completely
- Shows only dots (4px radius)
- Added opacity (0.8)

## Technical Implementation Details

### Path Generation
```typescript
// New standard line path generation - starts from 0
const generateStandardPath = (data: BuildingMortalityData[]) => {
  if (data.length === 0) return ""
  
  // Start from 0,0 and connect to first data point
  let path = `M ${padding.left} ${scaleY(0)}`
  
  // Connect to each data point
  data.forEach((d) => {
    path += ` L ${scaleX(d.day)} ${scaleY(d.mortality)}`
  })
  
  return path
}
```

### Enhanced Styling
- **Stroke Width**: Increased from 3px to 4px for standard lines
- **Dot Sizes**: Standard dots are 5px, actual data dots are 4px
- **Opacity**: Added 0.8 opacity to actual data dots for better distinction
- **Filters**: Added custom SVG filters for enhanced visual effects

### Legend Updates
- **Standard**: Shows as a thick line with "Standard (%)" label
- **Actual Data**: Shows as dots with "(Actual)" suffix
- **Visual Consistency**: All charts now have matching legend styles

## Result
Your charts now display:
1. **Standard performance lines** that start from 0 with enhanced, professional styling
2. **Actual performance data** as individual dots without connecting lines
3. **Clear visual distinction** between standard expectations and actual results
4. **Professional appearance** with consistent design across all chart types

## Files Modified
- `src/components/charts/MortalityChart.tsx`
- `src/components/charts/BuildingPerformanceLineChart.tsx`
- `src/components/charts/BuildingPerformanceLineChartLarge.tsx`
- `src/components/charts/WeightChart.tsx`
- `src/components/charts/FCRChart.tsx`
- `src/components/charts/ADGChart.tsx`

All changes maintain backward compatibility while implementing your specific design requirements.





