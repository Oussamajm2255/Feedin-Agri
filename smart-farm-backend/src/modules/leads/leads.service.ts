import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ContactRequest } from "../../entities/contact-request.entity";
import { TrainingRequest } from "../../entities/training-request.entity";
import { CreateContactRequestDto } from "./dto/create-contact-request.dto";
import { CreateTrainingRequestDto } from "./dto/create-training-request.dto";

/**
 * LeadsService handles persistence and event emission for
 * Contact and Training request submissions from the public landing pages.
 *
 * It follows the same event-driven pattern as UsersService:
 * save entity → emit event → AdminNotificationsService picks it up.
 */
@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    @InjectRepository(ContactRequest)
    private readonly contactRepo: Repository<ContactRequest>,
    @InjectRepository(TrainingRequest)
    private readonly trainingRepo: Repository<TrainingRequest>,
    private readonly events: EventEmitter2,
  ) {}

  /**
   * Persist a contact request and emit a lead event for admin notification.
   */
  async createContactRequest(
    dto: CreateContactRequestDto,
  ): Promise<ContactRequest> {
    this.logger.log(`📨 [LEADS] New contact request from: ${dto.email}`);

    const request = this.contactRepo.create({
      ...dto,
      status: "new",
    });

    const saved = await this.contactRepo.save(request);
    this.logger.log(`📨 [LEADS] Contact request saved: ${saved.id}`);

    // Emit event — AdminNotificationsService will create the admin notification
    this.events.emit("lead.created", {
      type: "contact",
      lead: saved,
    });

    return saved;
  }

  /**
   * Persist a training request and emit a lead event for admin notification.
   */
  async createTrainingRequest(
    dto: CreateTrainingRequestDto,
  ): Promise<TrainingRequest> {
    this.logger.log(
      `🎓 [LEADS] New training request from: ${dto.email} — ${dto.training_type}`,
    );

    const request = this.trainingRepo.create({
      ...dto,
      status: "new",
    });

    const saved = await this.trainingRepo.save(request);
    this.logger.log(`🎓 [LEADS] Training request saved: ${saved.id}`);

    // Emit event — AdminNotificationsService will create the admin notification
    this.events.emit("lead.created", {
      type: "training",
      lead: saved,
    });

    return saved;
  }
}
