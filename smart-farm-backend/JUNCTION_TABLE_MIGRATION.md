# Junction Table Migration - Farm Moderators

## Overview

Switched from JSONB array to proper junction table for farm-moderator many-to-many relationship.

## Changes Made

### 1. New Migration: `1739100000000-CreateFarmModeratorsJunctionTable.ts`

**Creates:**
- `farm_moderators` junction table with:
  - `farm_id` (VARCHAR(36)) - Foreign key to farms
  - `user_id` (VARCHAR(36)) - Foreign key to users
  - `assigned_at` (TIMESTAMP) - When moderator was assigned
  - Composite PRIMARY KEY (farm_id, user_id)
  - Foreign key constraints with CASCADE delete
  - Indexes on both columns for efficient queries

**Migrates:**
- Existing data from JSONB array to junction table
- Handles empty arrays gracefully

**Removes:**
- `assigned_moderators` JSONB column from farms table
- GIN index on JSONB column

### 2. Updated Farm Entity

**Before:**
```typescript
@Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
assigned_moderators: string[];
```

**After:**
```typescript
@ManyToMany(() => User, (user) => user.moderatedFarms)
@JoinTable({
  name: 'farm_moderators',
  joinColumn: { name: 'farm_id', referencedColumnName: 'farm_id' },
  inverseJoinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
})
assigned_moderators: User[];
```

### 3. Updated User Entity

**Added:**
```typescript
@ManyToMany(() => Farm, (farm) => farm.assigned_moderators)
moderatedFarms: Farm[];
```

### 4. Updated AdminService

**Before:**
```typescript
const moderatorIds = (farm.assigned_moderators || []) as string[];
const moderators = moderatorIds.length > 0
  ? await this.userRepository.find({
      where: { user_id: In(moderatorIds), role: UserRole.MODERATOR },
    })
  : [];
```

**After:**
```typescript
const farm = await this.farmRepository.findOne({
  where: { farm_id: farmId },
  relations: ['owner', 'assigned_moderators'],
});

const moderators = farm.assigned_moderators || [];
const moderatorIds = moderators.map((m) => m.user_id);
```

**PATCH Update:**
```typescript
// Assign moderators using TypeORM relationship
farm.assigned_moderators = validModerators;
```

## Benefits

### ✅ Data Integrity
- Foreign key constraints ensure valid user IDs
- CASCADE delete removes assignments when user/farm is deleted
- PRIMARY KEY prevents duplicate assignments

### ✅ Query Performance
- Indexed lookups on both columns
- Fast reverse queries ("all farms for moderator Y")
- Efficient joins with TypeORM

### ✅ Type Safety
- TypeORM handles relationship automatically
- No manual JSONB parsing
- Type-safe User objects instead of string arrays

### ✅ Maintainability
- Standard many-to-many pattern
- No custom JSONB operators needed
- Easier to understand and debug

## Migration Order

1. **First:** Run `1739000000000-AddAdminFarmFields.ts`
   - Adds city, region, country, description
   - Does NOT add assigned_moderators (moved to junction table)

2. **Second:** Run `1739100000000-CreateFarmModeratorsJunctionTable.ts`
   - Creates junction table
   - Migrates any existing JSONB data
   - Removes JSONB column

## Rollback

If you need to rollback:

1. Rollback junction table migration (restores JSONB column)
2. Rollback admin fields migration (removes metadata columns)

## Usage Examples

### Check if moderator is assigned to farm
```typescript
const isAssigned = await this.farmRepository
  .createQueryBuilder('farm')
  .innerJoin('farm.assigned_moderators', 'moderator')
  .where('farm.farm_id = :farmId', { farmId })
  .andWhere('moderator.user_id = :moderatorId', { moderatorId })
  .getOne() !== null;
```

### Get all farms for a moderator
```typescript
const farms = await this.farmRepository
  .createQueryBuilder('farm')
  .innerJoin('farm.assigned_moderators', 'moderator')
  .where('moderator.user_id = :moderatorId', { moderatorId })
  .getMany();
```

### Get all moderators for a farm
```typescript
const farm = await this.farmRepository.findOne({
  where: { farm_id },
  relations: ['assigned_moderators'],
});
const moderators = farm.assigned_moderators;
```

## Testing Checklist

- [x] Migration creates junction table
- [x] Migration migrates existing data
- [x] Migration removes JSONB column
- [x] Entity relationships work correctly
- [x] GET /admin/farms/:id returns moderators
- [x] PATCH /admin/farms/:id updates moderators
- [x] Foreign key constraints work
- [x] CASCADE delete works
- [x] No duplicate assignments possible














