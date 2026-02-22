import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableColumn } from 'typeorm';

/**
 * Migration: Create zones table and add zone_id to sensors, crops, devices.
 *
 * This is the foundational migration for Zone-centric architecture.
 * All operations are non-destructive and backward compatible.
 */
export class CreateZonesAndRelations1740000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Create zones table ────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'zones',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'farm_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '30',
            default: "'outdoor'",
          },
          {
            name: 'area_m2',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'coordinates',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            precision: 6,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            precision: 6,
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            precision: 6,
            isNullable: true,
          },
        ],
        indices: [
          { columnNames: ['farm_id'] },
          { columnNames: ['status'] },
        ],
        uniques: [
          { columnNames: ['farm_id', 'name'], name: 'UQ_zone_name_farm' },
        ],
      }),
      true,
    );

    // ── 2. Add zone_id to sensors ────────────────────────────
    await queryRunner.addColumn(
      'sensors',
      new TableColumn({
        name: 'zone_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createIndex(
      'sensors',
      new TableIndex({ columnNames: ['zone_id'] }),
    );

    // ── 3. Add zone_id to crops ──────────────────────────────
    await queryRunner.addColumn(
      'crops',
      new TableColumn({
        name: 'zone_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createIndex(
      'crops',
      new TableIndex({ columnNames: ['zone_id'] }),
    );

    // ── 4. Add zone_id to devices ────────────────────────────
    await queryRunner.addColumn(
      'devices',
      new TableColumn({
        name: 'zone_id',
        type: 'uuid',
        isNullable: true,
      }),
    );
    await queryRunner.createIndex(
      'devices',
      new TableIndex({ columnNames: ['zone_id'] }),
    );

    // ── 5. Add foreign keys ──────────────────────────────────
    // zones.farm_id → farms.farm_id
    await queryRunner.createForeignKey(
      'zones',
      new TableForeignKey({
        columnNames: ['farm_id'],
        referencedTableName: 'farms',
        referencedColumnNames: ['farm_id'],
        onDelete: 'CASCADE',
      }),
    );

    // sensors.zone_id → zones.id
    await queryRunner.createForeignKey(
      'sensors',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // crops.zone_id → zones.id
    await queryRunner.createForeignKey(
      'crops',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // devices.zone_id → zones.id
    await queryRunner.createForeignKey(
      'devices',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys (by column name lookup)
    const sensorsTable = await queryRunner.getTable('sensors');
    const cropTable = await queryRunner.getTable('crops');
    const devicesTable = await queryRunner.getTable('devices');
    const zonesTable = await queryRunner.getTable('zones');

    // Drop zone_id foreign keys
    if (sensorsTable) {
      const fk = sensorsTable.foreignKeys.find((f) => f.columnNames.includes('zone_id'));
      if (fk) await queryRunner.dropForeignKey('sensors', fk);
      await queryRunner.dropColumn('sensors', 'zone_id');
    }

    if (cropTable) {
      const fk = cropTable.foreignKeys.find((f) => f.columnNames.includes('zone_id'));
      if (fk) await queryRunner.dropForeignKey('crops', fk);
      await queryRunner.dropColumn('crops', 'zone_id');
    }

    if (devicesTable) {
      const fk = devicesTable.foreignKeys.find((f) => f.columnNames.includes('zone_id'));
      if (fk) await queryRunner.dropForeignKey('devices', fk);
      await queryRunner.dropColumn('devices', 'zone_id');
    }

    // Drop zones table
    await queryRunner.dropTable('zones', true);
  }
}
