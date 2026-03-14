import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDigitalTwins1740000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'digital_twins',
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
            name: 'zone_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'media_url',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'config',
            type: 'jsonb',
            default: "'{}'",
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
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'digital_twins',
      new TableForeignKey({
        columnNames: ['farm_id'],
        referencedTableName: 'farms',
        referencedColumnNames: ['farm_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'digital_twins',
      new TableForeignKey({
        columnNames: ['zone_id'],
        referencedTableName: 'zones',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('digital_twins');
    const fkFarm = table.foreignKeys.find((fk) => fk.columnNames.indexOf('farm_id') !== -1);
    const fkZone = table.foreignKeys.find((fk) => fk.columnNames.indexOf('zone_id') !== -1);

    if (fkFarm) await queryRunner.dropForeignKey('digital_twins', fkFarm);
    if (fkZone) await queryRunner.dropForeignKey('digital_twins', fkZone);

    await queryRunner.dropTable('digital_twins');
  }
}
