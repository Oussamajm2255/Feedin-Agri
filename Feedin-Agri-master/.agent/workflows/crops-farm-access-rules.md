---
description: Implementation plan for crops-farm access control rules
---

# Crops-Farm Access Control Rules Implementation

## Business Rules Summary

| Rule | Description | Status |
|------|-------------|--------|
| **Rule 1** | Crops belong directly to a Farm (`farm_id` required on Crop) | ✅ Implemented |
| **Rule 2** | Crops have NO relationship with Sensors (sensors belong to farms/fields) | ✅ Implemented |
| **Rule 3** | Farm Owners see only crops on farms they own | ✅ Implemented |
| **Rule 4** | Farm Moderators see only crops on farms they moderate | ✅ Implemented |
| **Rule 5** | Admins see all crops with grouping capabilities | ✅ Implemented |
| **Rule 6** | Crop creation requires farm selection (auto-select if only one farm) | ✅ Implemented |
| **Rule 7** | Farmers with no farms see "Add farms first to start tracking crops" message | ✅ Implemented |

## Implementation Phases

### Phase 1: Backend Entity Changes ✅ COMPLETE

#### 1.1 Modify `crop.entity.ts` ✅
- Added `farm_id: string` column (required)
- Added `@ManyToOne` relationship to Farm
- Removed `sensors` relationship
- Added `farm` relation for eager loading

#### 1.2 Modify `sensor.entity.ts` ✅
- Removed `crop_id` column
- Removed `@ManyToOne` relationship to Crop

#### 1.3 Create database migration ✅
- Created `migrations/crop-farm-access-control.sql`
- Adds `farm_id` column to `crops` table
- Adds foreign key constraint
- Removes `crop_id` column from `sensors` table

### Phase 2: Backend Service Changes ✅ COMPLETE

#### 2.1 Modify `crops.service.ts` ✅
- Added `getUserAccessibleFarmIds()` method for access control
- Updated `findAll()` to filter by user's farms
- Updated `create()` to require `farm_id` and validate farm access
- Updated `findOne()` to include farm relation and check access
- Removed sensor-related methods
- Added grouping methods for admin feature

#### 2.2 Modify `crops.controller.ts` ✅
- Added `@Request()` decorator to get authenticated user
- Passed user ID to all service methods
- Added new grouping endpoints

### Phase 3: Backend DTO Changes ✅ COMPLETE

#### 3.1 Modify `create-crop.dto.ts` ✅
- Added `farm_id` as required field

#### 3.2 Modify `update-crop.dto.ts` ✅
- Added `farm_id` as optional field (for moving crops between farms)

### Phase 4: Frontend Model Changes ✅ COMPLETE

#### 4.1 Modify `farm.model.ts` ✅
- Added `farm_id` to Crop interface
- Added `farm?: Farm` optional relation
- Removed `sensors` from Crop interface
- Removed `crop_id` from Sensor interface

### Phase 5: Frontend Service Changes ✅ COMPLETE

#### 5.1 Modify `crop.service.ts` ✅
- Updated imports to include Farm
- Updated CropDashboardData interface to include farm

### Phase 6: Frontend Component Changes ✅ COMPLETE

#### 6.1 Modify `crop-form.component.ts` ✅
- Added farm selector dropdown
- Auto-select if user has only one farm
- Show "Add farms first" message if user has no farms

#### 6.2 `crops-dashboard.ts` - PARTIAL
- Dashboard still references sensors from farm context (acceptable)
- Empty state for "no farms" needs translation keys added

### Phase 7: Database Schema Update ⏳ PENDING

#### 7.1 Update `smart_farm_schema.sql` - MANUAL
- Migration script created at `migrations/crop-farm-access-control.sql`
- User needs to run migration manually

## Files Changed

| File | Change Type |
|------|-------------|
| `src/entities/crop.entity.ts` | Modified - Added farm_id, removed sensors |
| `src/entities/sensor.entity.ts` | Modified - Removed crop_id |
| `src/modules/crops/crops.service.ts` | Replaced - Full rewrite with access control |
| `src/modules/crops/crops.controller.ts` | Replaced - Added user context |
| `src/modules/crops/crops.module.ts` | Modified - Added Farm, User imports |
| `src/modules/crops/dto/create-crop.dto.ts` | Modified - Added farm_id |
| `src/modules/crops/dto/update-crop.dto.ts` | Modified - Added farm_id |
| `src/modules/admin/admin.service.ts` | Modified - Removed crop_id references |
| `smart-farm-frontend/src/app/core/models/farm.model.ts` | Modified - Updated interfaces |
| `smart-farm-frontend/src/app/core/services/crop.service.ts` | Modified - Updated interfaces |
| `smart-farm-frontend/src/app/features/crops/crop-form/crop-form.component.ts` | Replaced - Added farm selection |
| `migrations/crop-farm-access-control.sql` | Created - Database migration |

## Testing Checklist

- [ ] Farmer with farms can see their crops
- [ ] Farmer with no farms sees empty state
- [ ] Farmer cannot see other farmers' crops
- [ ] Moderator sees crops on moderated farms
- [ ] Admin sees all crops
- [ ] Crop creation requires farm selection
- [ ] Auto-select works for single farm users
- [ ] Grouping by farm works
- [ ] Grouping by growth stage works
- [ ] Grouping by planting date works

## Next Steps

1. **Run Database Migration**: Execute `migrations/crop-farm-access-control.sql`
2. **Add Translation Keys**: Add missing translation keys for new UI text
3. **Test Access Control**: Verify with different user roles
4. **Update Dashboard**: Update crops-dashboard to handle "no farms" state

