import {MigrationInterface, QueryRunner} from "typeorm";

export class schemasync1624899460317 implements MigrationInterface {
    name = 'schemasync1624899460317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coffee" ADD "description" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "coffee" DROP COLUMN "description"`);
    }

}
