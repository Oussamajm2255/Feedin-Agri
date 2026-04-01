import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactRequest } from "../../entities/contact-request.entity";
import { TrainingRequest } from "../../entities/training-request.entity";
import { LeadsService } from "./leads.service";
import { LeadsController } from "./leads.controller";

@Module({
  imports: [TypeOrmModule.forFeature([ContactRequest, TrainingRequest])],
  providers: [LeadsService],
  controllers: [LeadsController],
  exports: [LeadsService],
})
export class LeadsModule {}
